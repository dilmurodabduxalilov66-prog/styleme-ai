import { Injectable, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import * as mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { BarberPortfolio, ClientDossier } from '../../../common/database/mongo-schemas';

@Injectable()
export class BookingService {
  private dbPool: Pool;
  private redis: Redis;

  constructor() {
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://styleme_user:styleme_password@localhost:5432/styleme_db',
    });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Initialize MongoDB Mongoose Connection
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://mongodb:27017/styleme_portfolio';
    mongoose.connect(mongoUri)
      .then(() => console.log('MongoDB successfully connected in BookingService.'))
      .catch(err => console.error('MongoDB connection error:', err));
  }

  // ============================================================================
  // PostGIS Spatial Search (OPTIMIZED with pre-projected columns and index)
  // ============================================================================
  async searchBarbersNearby(lat: number, lng: number, radiusKm: number, maxPrice?: number, search?: string, rank?: string) {
    const radiusMeters = radiusKm * 1000;
    
    // We project to UTM 42N (SRID 32642) using pre-projected geog_proj column for sub-50ms speed
    const query = `
      SELECT 
        bp.user_id, bp.business_name, bp.bio, bp.latitude, bp.longitude, bp.address, bp.skills, bp.base_price,
        br.raw_score, br.rank_grade,
        ST_Distance(
          bp.geog_proj,
          ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 32642)
        ) AS distance_meters
      FROM barber_profiles bp
      LEFT JOIN barber_rankings br ON bp.user_id = br.barber_id
      INNER JOIN barber_verifications bv ON bp.user_id = bv.barber_id AND bv.status = 'APPROVED'
      WHERE bp.is_available = TRUE 
        AND ST_DWithin(
          bp.geog_proj,
          ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 32642),
          $3
        )
        ${maxPrice ? `AND bp.base_price <= ${maxPrice}` : ''}
        ${rank && rank !== 'ALL' ? `AND br.rank_grade = '${rank}'` : ''}
        ${search ? `AND (bp.business_name ILIKE '%${search}%' OR array_to_string(bp.skills, ', ') ILIKE '%${search}%')` : ''}
      ORDER BY COALESCE(br.raw_score, 0) DESC, distance_meters ASC;
    `;

    try {
      const res = await this.dbPool.query(query, [lat, lng, radiusMeters]);
      return res.rows;
    } catch (err) {
      throw new InternalServerErrorException(err.message || 'Spatial query failed.');
    }
  }

  // ============================================================================
  // Booking Creation with Redis Concurrency Locking
  // ============================================================================
  async createBooking(userId: string, barberId: string, startTimeStr: string, endTimeStr: string, paymentMethod: string) {
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Acquire lock with 5-second TTL
    const slotKey = `lock:barber:${barberId}:slot:${startTime.getTime()}`;
    const lockValue = randomUUID();
    
    const lockAcquired = await this.redis.set(slotKey, lockValue, 'PX', 5000, 'NX');
    if (!lockAcquired) {
      throw new ConflictException('Timeslot is currently being booked by another customer. Please try again.');
    }

    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');

      const overlapQuery = `
        SELECT id FROM bookings 
        WHERE barber_id = $1 
          AND current_status IN ('PENDING', 'CONFIRMED')
          AND (
            (scheduled_start <= $2 AND scheduled_end > $2) OR
            (scheduled_start < $3 AND scheduled_end >= $3) OR
            (scheduled_start >= $2 AND scheduled_end <= $3)
          )
        FOR UPDATE;
      `;
      const overlapRes = await client.query(overlapQuery, [barberId, startTime, endTime]);
      
      if (overlapRes.rows.length > 0) {
        throw new ConflictException('Barber is already booked during this timeslot.');
      }

      let otpCode = null;
      if (paymentMethod === 'CASH') {
        otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      }

      const barberProfileRes = await client.query('SELECT base_price FROM barber_profiles WHERE user_id = $1', [barberId]);
      const currentPrice = barberProfileRes.rows[0]?.base_price || 50000;

      const bookingId = randomUUID();
      const insertQuery = `
        INSERT INTO bookings (id, user_id, barber_id, scheduled_start, scheduled_end, payment_method, otp_code, current_status, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
        RETURNING id, scheduled_start, scheduled_end, current_status, payment_method, otp_code, price;
      `;
      const bookingRes = await client.query(insertQuery, [
        bookingId, userId, barberId, startTime, endTime, paymentMethod, otpCode, currentPrice
      ]);

      await client.query(
        `INSERT INTO booking_status_history (booking_id, scheduled_start, status_to, changed_by)
         VALUES ($1, $2, 'PENDING', $3)`,
        [bookingId, startTime, userId]
      );

      await client.query('COMMIT');
      return bookingRes.rows[0];

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      const releaseScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.redis.eval(releaseScript, 1, slotKey, lockValue);
    }
  }

  // ============================================================================
  // Complete Booking (with OTP Cash settlement)
  // ============================================================================
  async completeBooking(bookingId: string, scheduledStartStr: string, barberId: string, otpCodeRaw?: string) {
    const scheduledStart = new Date(scheduledStartStr);
    const client = await this.dbPool.connect();

    try {
      await client.query('BEGIN');

      const res = await client.query(
        `SELECT id, user_id, barber_id, scheduled_start, current_status, payment_method, otp_code, price
         FROM bookings 
         WHERE id = $1 AND scheduled_start = $2 FOR UPDATE`,
        [bookingId, scheduledStart]
      );

      if (res.rows.length === 0) {
        throw new NotFoundException('Booking not found');
      }

      const booking = res.rows[0];

      if (booking.barber_id !== barberId) {
        throw new BadRequestException('Unauthorised actions.');
      }

      if (booking.current_status === 'COMPLETED') {
        throw new BadRequestException('Booking is already completed.');
      }

      if (booking.payment_method === 'CASH') {
        if (!otpCodeRaw || booking.otp_code !== otpCodeRaw) {
          throw new BadRequestException('Invalid SMS OTP confirmation code.');
        }
      }

      await client.query(
        `UPDATE bookings 
         SET current_status = 'COMPLETED', is_paid = true, otp_verified_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND scheduled_start = $2`,
        [bookingId, scheduledStart]
      );

      await client.query(
        `INSERT INTO booking_status_history (booking_id, scheduled_start, status_from, status_to, changed_by)
         VALUES ($1, $2, $3, 'COMPLETED', $4)`,
        [bookingId, scheduledStart, booking.current_status, barberId]
      );

      const rankingRes = await client.query(
        'SELECT rank_grade FROM barber_rankings WHERE barber_id = $1', [barberId]
      );
      
      const rank = rankingRes.rows.length > 0 ? rankingRes.rows[0].rank_grade : 'C';
      const commissionRate = rank === 'S' ? 0.05 : rank === 'A' ? 0.07 : 0.10;

      const serviceAmount = booking.price ? parseFloat(booking.price) : 60000.00;
      const commissionDebt = serviceAmount * commissionRate;

      const paymentId = randomUUID();
      await client.query(
        `INSERT INTO payments (id, booking_id, amount, payment_gateway, status)
         VALUES ($1, $2, $3, $4, 'SUCCEEDED')`,
        [paymentId, bookingId, serviceAmount, booking.payment_method]
      );

      if (booking.payment_method === 'CASH') {
        await client.query(
          `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
           VALUES ($1, $2, NULL, $3, 'COMMISSION_DEBIT')`,
          [paymentId, barberId, commissionDebt]
        );
      } else {
        const netBarberPayout = serviceAmount - commissionDebt;
        await client.query(
          `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
           VALUES ($1, $2, NULL, $3, 'COMMISSION_DEBIT')`,
          [paymentId, barberId, commissionDebt]
        );
        await client.query(
          `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
           VALUES ($1, NULL, $2, $3, 'BARBER_PAYOUT')`,
          [paymentId, barberId, netBarberPayout]
        );
      }

      // Add loyalty points to the user (+5)
      await client.query(
        `INSERT INTO user_loyalty (user_id, points) VALUES ($1, 5)
         ON CONFLICT (user_id) DO UPDATE SET points = user_loyalty.points + 5`,
        [booking.user_id]
      );

      await client.query('COMMIT');
      return { bookingId, status: 'COMPLETED', verified: true };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CRM: Get Unique Clients for Barber
  // ============================================================================
  async getCrmClients(barberId: string) {
    const res = await this.dbPool.query(
      `SELECT 
         u.id as user_id, 
         COALESCE(up.first_name || ' ' || up.last_name, u.email) as full_name, 
         u.phone_number,
         COUNT(b.id) as total_visits,
         MAX(b.scheduled_start) as last_visit
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE b.barber_id = $1 AND b.current_status IN ('COMPLETED', 'CONFIRMED')
       GROUP BY u.id, up.first_name, up.last_name, u.email, u.phone_number
       ORDER BY last_visit DESC`,
      [barberId]
    );
    
    return res.rows.map(row => ({
      id: row.user_id,
      name: row.full_name || 'Mijoz',
      phone: row.phone_number || '',
      lastVisit: new Date(row.last_visit).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      totalVisits: parseInt(row.total_visits, 10)
    }));
  }

  async getTodayBookings(barberId: string, dateQuery?: string) {
    const todayStart = dateQuery ? new Date(dateQuery) : new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = dateQuery ? new Date(dateQuery) : new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const res = await this.dbPool.query(
      `SELECT b.id, b.scheduled_start, b.scheduled_end, b.current_status, b.payment_method, b.otp_code, COALESCE(up.first_name || ' ' || up.last_name, u.email) as customer_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE b.barber_id = $1 
         AND b.current_status IN ('PENDING', 'CONFIRMED')
         AND b.scheduled_start >= $2 AND b.scheduled_start <= $3
       ORDER BY b.scheduled_start ASC`,
      [barberId, todayStart, todayEnd]
    );
    return res.rows.map(row => ({
      id: row.id,
      customerName: row.customer_name || 'Mijoz',
      timeSlot: `${new Date(row.scheduled_start).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' })} - ${new Date(row.scheduled_end).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' })}`,
      scheduledStart: row.scheduled_start,
      status: row.current_status,
      otpCode: row.otp_code,
      price: '50,000 UZS'
    }));
  }

  async getHistoryBookings(barberId: string) {
    const res = await this.dbPool.query(
      `SELECT b.id, b.scheduled_start, b.scheduled_end, b.current_status, b.payment_method, b.otp_code, b.price, COALESCE(up.first_name || ' ' || up.last_name, u.email) as customer_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE b.barber_id = $1 
         AND b.current_status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW')
       ORDER BY b.scheduled_start DESC
       LIMIT 50`,
      [barberId]
    );
    return res.rows.map(row => ({
      id: row.id,
      customerName: row.customer_name || 'Mijoz',
      timeSlot: `${new Date(row.scheduled_start).toISOString().substring(11, 16)} - ${new Date(row.scheduled_end).toISOString().substring(11, 16)}`,
      status: row.current_status,
      otpCode: row.otp_code,
      price: row.price ? `${parseFloat(row.price).toLocaleString()} UZS` : '50,000 UZS'
    }));
  }

  // ============================================================================
  // AVAILABILITY & SHIFTS METHODS
  // ============================================================================

  async updateWeeklySchedule(barberId: string, workHours: any) {
    try {
      await this.dbPool.query(
        'UPDATE barber_profiles SET work_hours = $1 WHERE user_id = $2',
        [JSON.stringify(workHours), barberId]
      );
      return { success: true, work_hours: workHours };
    } catch (err) {
      throw new InternalServerErrorException('Failed to update work schedule.');
    }
  }

  async getWeeklySchedule(barberId: string) {
    const profileRes = await this.dbPool.query(
      'SELECT work_hours FROM barber_profiles WHERE user_id = $1',
      [barberId]
    );
    if (profileRes.rows.length === 0) return { work_hours: null };
    
    let workHours = profileRes.rows[0].work_hours;
    if (typeof workHours === 'string') {
      try {
        workHours = JSON.parse(workHours);
      } catch (e) {}
    }
    return { work_hours: workHours };
  }

  // ============================================================================
  // BARBER PROFILE (Settings)
  // ============================================================================
  async getBarberProfileInfo(barberId: string) {
    let profileRes = await this.dbPool.query(
      `SELECT bp.business_name, bp.bio, bp.latitude, bp.longitude, bp.address, bp.profile_image_url, bp.base_price,
              bv.status as verification_status, bv.rejection_reason
       FROM barber_profiles bp
       LEFT JOIN barber_verifications bv ON bp.user_id = bv.barber_id
       WHERE bp.user_id = $1`,
      [barberId]
    );
    if (profileRes.rows.length === 0) {
      // Create an empty default profile if it doesn't exist
      await this.dbPool.query(
        'INSERT INTO barber_profiles (user_id, business_name, is_available) VALUES ($1, $2, true)',
        [barberId, 'Yangi Sartaroshxona']
      );
      profileRes = await this.dbPool.query(
        `SELECT bp.business_name, bp.bio, bp.latitude, bp.longitude, bp.address, bp.profile_image_url, bp.base_price,
                bv.status as verification_status, bv.rejection_reason
         FROM barber_profiles bp
         LEFT JOIN barber_verifications bv ON bp.user_id = bv.barber_id
         WHERE bp.user_id = $1`,
        [barberId]
      );
    }
    return profileRes.rows[0];
  }

  async submitVerification(barberId: string, documentUrl: string) {
    try {
      await this.dbPool.query('DELETE FROM barber_verifications WHERE barber_id = $1', [barberId]);
      const res = await this.dbPool.query(
        `INSERT INTO barber_verifications (barber_id, document_type, document_url, status) 
         VALUES ($1, 'CERTIFICATE', $2, 'PENDING')
         RETURNING id, status`,
        [barberId, documentUrl]
      );
      return { success: true, verification: res.rows[0] };
    } catch (err) {
      throw new InternalServerErrorException('Failed to submit verification request.');
    }
  }

  async updateBarberProfileInfo(barberId: string, data: { business_name?: string; bio?: string; latitude?: number; longitude?: number; address?: string; profile_image_url?: string; base_price?: number }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.business_name !== undefined) {
      fields.push(`business_name = $${idx++}`);
      values.push(data.business_name);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(data.address);
    }
    if (data.profile_image_url !== undefined) {
      fields.push(`profile_image_url = $${idx++}`);
      values.push(data.profile_image_url);
    }
    if (data.base_price !== undefined) {
      fields.push(`base_price = $${idx++}`);
      values.push(data.base_price);
    }
    if (data.latitude !== undefined && data.longitude !== undefined) {
      const latIdx = idx++;
      fields.push(`latitude = $${latIdx}`);
      values.push(data.latitude);
      
      const lonIdx = idx++;
      fields.push(`longitude = $${lonIdx}`);
      values.push(data.longitude);
      
      const geogLonIdx = idx++;
      const geogLatIdx = idx++;
      fields.push(`geog = ST_SetSRID(ST_MakePoint($${geogLonIdx}::float, $${geogLatIdx}::float), 4326)`);
      values.push(data.longitude);
      values.push(data.latitude);
    }

    if (fields.length === 0) return { success: true };

    values.push(barberId);
    const query = `UPDATE barber_profiles SET ${fields.join(', ')} WHERE user_id = $${idx}`;
    
    try {
      await this.dbPool.query(query, values);
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      throw new InternalServerErrorException('Failed to update profile info');
    }
  }

  async addHoliday(barberId: string, holidayDateStr: string, reason: string) {
    const holidayDate = new Date(holidayDateStr);
    try {
      await this.dbPool.query(
        `INSERT INTO barber_holidays (barber_id, holiday_date, reason) 
         VALUES ($1, $2, $3)
         ON CONFLICT (barber_id, holiday_date) DO UPDATE SET reason = EXCLUDED.reason`,
        [barberId, holidayDate, reason]
      );
      return { success: true, holiday: { holiday_date: holidayDateStr, reason } };
    } catch (err) {
      throw new InternalServerErrorException('Failed to insert holiday block.');
    }
  }

  async getHolidays(barberId: string) {
    const res = await this.dbPool.query(
      'SELECT id, holiday_date as date, reason FROM barber_holidays WHERE barber_id = $1 ORDER BY holiday_date ASC',
      [barberId]
    );
    return res.rows;
  }

  async deleteHoliday(barberId: string, holidayId: string) {
    await this.dbPool.query(
      'DELETE FROM barber_holidays WHERE id = $1 AND barber_id = $2',
      [holidayId, barberId]
    );
    return { status: 'SUCCESS' };
  }

  async queryAvailableSlots(barberId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    
    // 1. Check if date is a blocked holiday
    const holidayRes = await this.dbPool.query(
      'SELECT id FROM barber_holidays WHERE barber_id = $1 AND holiday_date = $2',
      [barberId, targetDate]
    );
    if (holidayRes.rows.length > 0) {
      return { date: dateStr, available_slots: [] };
    }

    // 2. Fetch barber's work schedule
    const profileRes = await this.dbPool.query(
      'SELECT work_hours FROM barber_profiles WHERE user_id = $1',
      [barberId]
    );
    if (profileRes.rows.length === 0) {
      throw new NotFoundException('Barber profile not found.');
    }

    let workHours = profileRes.rows[0].work_hours || {};
    if (typeof workHours === 'string') {
      try {
        workHours = JSON.parse(workHours);
      } catch (e) {}
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const uzDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      
    const dayIndex = targetDate.getUTCDay();
    const dayName = days[dayIndex];
    const uzDayName = uzDays[dayIndex];

    let todayHours = null;
    if (workHours.days) {
      if (workHours.days[uzDayName]) {
        todayHours = { active: true, start: workHours.start, end: workHours.end };
      }
    } else {
      todayHours = workHours[dayName];
    }
  
    if (!todayHours || !todayHours.active || !todayHours.start || !todayHours.end) {
      return { date: dateStr, available_slots: [] };
    }

    // Parse start/end hours (e.g. "09:00" and "18:00")
    const [startH, startM] = todayHours.start.split(':').map(Number);
    const [endH, endM] = todayHours.end.split(':').map(Number);

    // 3. Fetch existing bookings for this date
    const UZT_OFFSET = 5; // Uzbekistan is UTC+5
    const startOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0 - UZT_OFFSET, 0, 0));
    const endOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23 - UZT_OFFSET, 59, 59));

    const bookingsRes = await this.dbPool.query(
      `SELECT scheduled_start, scheduled_end FROM bookings 
       WHERE barber_id = $1 
         AND current_status IN ('PENDING', 'CONFIRMED')
         AND scheduled_start BETWEEN $2 AND $3`,
      [barberId, startOfDay, endOfDay]
    );

    // Generate hourly slots
    const slots = [];
    let currentHour = startH;

    while (currentHour < endH) {
      const slotStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), currentHour - UZT_OFFSET, 0, 0));
      const slotEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), currentHour + 1 - UZT_OFFSET, 0, 0));

      // Check overlaps
      const isBooked = bookingsRes.rows.some(b => {
        const bStart = new Date(b.scheduled_start);
        const bEnd = new Date(b.scheduled_end);
        return (slotStart >= bStart && slotStart < bEnd) || (slotEnd > bStart && slotEnd <= bEnd);
      });

      slots.push({
        start: `${currentHour.toString().padStart(2, '0')}:00`,
        end: `${(currentHour + 1).toString().padStart(2, '0')}:00`,
        status: isBooked ? 'BOOKED' : 'AVAILABLE'
      });

      currentHour++;
    }

    return { date: dateStr, available_slots: slots };
  }

  // ============================================================================
  // CRM / DOSSIERS METHODS (MongoDB Mongoose integration)
  // ============================================================================

  async createDossier(barberId: string, clientId: string, faceShape: string, density: string, texture: string, imageUrl: string) {
    try {
      const dossier = new ClientDossier({
        client_id: clientId,
        barber_id: barberId,
        face_shape_profile: faceShape,
        hair_density: density,
        hair_texture: texture,
        approved_tryon_image_url: imageUrl
      });
      await dossier.save();
      return dossier;
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('CRM Dossier already exists for this client-barber association.');
      }
      throw new InternalServerErrorException(err.message || 'Failed to create dossier.');
    }
  }

  async addDossierNote(barberId: string, clientId: string, noteText: string, guardSizes: string, haircutDateStr: string) {
    const haircutDate = new Date(haircutDateStr);
    try {
      const res = await ClientDossier.findOneAndUpdate(
        { client_id: clientId, barber_id: barberId },
        { 
          $push: { 
            notes: { 
              note_text: noteText, 
              guard_sizes_used: guardSizes, 
              haircut_date: haircutDate 
            } 
          } 
        },
        { new: true, upsert: true }
      );
      return { success: true, note: { note_text: noteText, guard_sizes_used: guardSizes, haircut_date: haircutDateStr } };
    } catch (err) {
      throw new InternalServerErrorException(err.message || 'Failed to append dossier note.');
    }
  }

  async getDossier(barberId: string, clientId: string) {
    const dossier = await ClientDossier.findOne({ client_id: clientId, barber_id: barberId });
    if (!dossier) {
      throw new NotFoundException('Client CRM dossier not found.');
    }
    return dossier;
  }

  // ============================================================================
  // PORTFOLIO METHODS (MongoDB Mongoose integration)
  // ============================================================================

  async commitPortfolioItem(barberId: string, imageUrl: string, title: string, tags: string[]) {
    try {
      const res = await BarberPortfolio.findOneAndUpdate(
        { barber_id: barberId },
        { 
          $push: { 
            images: { 
              image_url: imageUrl, 
              title, 
              tags, 
              uploaded_at: new Date() 
            } 
          } 
        },
        { new: true, upsert: true }
      );
      // Retrieve the last committed item
      const images = res.images;
      const committedImage = images[images.length - 1];
      return { barber_id: barberId, image: committedImage };
    } catch (err) {
      throw new InternalServerErrorException('Failed to commit portfolio item.');
    }
  }

  async deletePortfolioItem(barberId: string, itemId: string) {
    try {
      const res = await BarberPortfolio.updateOne(
        { barber_id: barberId },
        { $pull: { images: { _id: itemId } } }
      );
      if (res.modifiedCount === 0) {
        throw new NotFoundException('Portfolio item not found.');
      }
      return { success: true, message: 'Portfolio image deleted successfully.' };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to delete portfolio image.');
    }
  }

  async getBarberPortfolio(barberId: string) {
    const portfolio = await BarberPortfolio.findOne({ barber_id: barberId });
    if (!portfolio) {
      return { barber_id: barberId, images: [] };
    }
    return portfolio;
  }

  // ============================================================================
  // SECURE AUDIT LOGGING HELPER
  // ============================================================================
  async writeAuditLog(actorId: string, action: string, resourceType: string, resourceId: string, diff?: any, ipAddress?: string) {
    try {
      await this.dbPool.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, payload_diff, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [actorId, action, resourceType, resourceId, diff ? JSON.stringify(diff) : null, ipAddress || '127.0.0.1']
      );
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
    }
  }

  async getClientActiveBookings(userId: string) {
    const res = await this.dbPool.query(
      `SELECT b.id, b.scheduled_start, b.scheduled_end, b.current_status, b.payment_method, b.otp_code, b.price,
              bp.business_name as usta, 'StyleMe Barbershop' as salon
       FROM bookings b
       LEFT JOIN barber_profiles bp ON b.barber_id = bp.user_id
       WHERE b.user_id = $1 AND b.current_status IN ('PENDING', 'CONFIRMED') AND b.scheduled_start >= NOW()
       ORDER BY b.scheduled_start ASC`,
      [userId]
    );

    return res.rows.map(row => {
      const date = new Date(row.scheduled_start);
      // Use Tashkent timezone for date string comparison
      const optionsDate: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Tashkent' };
      const isToday = date.toLocaleDateString('uz-UZ', optionsDate) === new Date().toLocaleDateString('uz-UZ', optionsDate);
      const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
      let timeFormatted = '';
      if (isToday) {
        timeFormatted = `Bugun, ${timeStr}`;
      } else {
        const monthDay = date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', timeZone: 'Asia/Tashkent' });
        timeFormatted = `${monthDay}, ${timeStr}`;
      }

      return {
        id: row.id,
        usta: row.usta || 'Sartarosh',
        salon: row.salon || 'Elite Barbershop',
        time: timeFormatted,
        otp: row.otp_code || '0000',
        price: row.price ? `${parseFloat(row.price).toLocaleString()} UZS` : '50,000 UZS',
      };
    });
  }

  async getClientMissedBookings(userId: string) {
    const res = await this.dbPool.query(
      `SELECT b.id, b.scheduled_start, b.scheduled_end, b.current_status, b.payment_method, b.otp_code, b.price, b.is_paid,
              bp.business_name as usta, 'StyleMe Barbershop' as salon,
              EXISTS(SELECT 1 FROM refund_requests rr WHERE rr.booking_id = b.id) as has_refund_request,
              (SELECT rr.status FROM refund_requests rr WHERE rr.booking_id = b.id LIMIT 1) as refund_status
       FROM bookings b
       LEFT JOIN barber_profiles bp ON b.barber_id = bp.user_id
       WHERE b.user_id = $1 AND b.current_status IN ('PENDING', 'CONFIRMED') AND b.scheduled_start < NOW()
       ORDER BY b.scheduled_start DESC`,
      [userId]
    );

    return res.rows.map(row => {
      const date = new Date(row.scheduled_start);
      // Use Tashkent timezone for date string comparison
      const optionsDate: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Tashkent' };
      const isToday = date.toLocaleDateString('uz-UZ', optionsDate) === new Date().toLocaleDateString('uz-UZ', optionsDate);
      const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
      let timeFormatted = '';
      if (isToday) {
        timeFormatted = `Bugun, ${timeStr}`;
      } else {
        const monthDay = date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', timeZone: 'Asia/Tashkent' });
        timeFormatted = `${monthDay}, ${timeStr}`;
      }

      // Check if it's been more than 24 hours since the appointment
      const oneDayPass = (Date.now() - date.getTime()) > (24 * 60 * 60 * 1000);

      return {
        id: row.id,
        usta: row.usta || 'Sartarosh',
        salon: row.salon || 'Elite Barbershop',
        time: timeFormatted,
        raw_time: date.toISOString(),
        price: row.price ? `${parseFloat(row.price).toLocaleString()} UZS` : '50,000 UZS',
        is_paid: row.is_paid,
        can_refund: row.is_paid && oneDayPass && !row.has_refund_request,
        has_refund_request: row.has_refund_request,
        refund_status: row.refund_status
      };
    });
  }

  async applyForRefund(userId: string, bookingId: string) {
    const checkRes = await this.dbPool.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND current_status IN ('PENDING', 'CONFIRMED') AND scheduled_start < NOW()`,
      [bookingId, userId]
    );
    if (checkRes.rows.length === 0) {
      throw new Error('Booking not found or not eligible for refund');
    }
    const booking = checkRes.rows[0];
    if (!booking.is_paid) {
      throw new Error('Booking is not paid');
    }
    const date = new Date(booking.scheduled_start);
    if ((Date.now() - date.getTime()) < (24 * 60 * 60 * 1000)) {
      throw new Error('Cannot apply for refund yet. 24 hours have not passed.');
    }
    const existing = await this.dbPool.query(`SELECT 1 FROM refund_requests WHERE booking_id = $1`, [bookingId]);
    if (existing.rows.length > 0) {
      throw new Error('Refund request already submitted');
    }
    const price = parseFloat(booking.price);
    const amountToRefund = price * 0.8;
    await this.dbPool.query(
      `INSERT INTO refund_requests (booking_id, user_id, amount_to_refund) VALUES ($1, $2, $3)`,
      [bookingId, userId, amountToRefund]
    );
    return { success: true, message: 'Refund request submitted' };
  }

  async getRefundRequests() {
    const res = await this.dbPool.query(
      `SELECT rr.id, rr.booking_id, rr.user_id, rr.status, rr.amount_to_refund, rr.created_at,
              b.price, b.scheduled_start, u.first_name, u.last_name
       FROM refund_requests rr
       JOIN bookings b ON rr.booking_id = b.id
       JOIN user_profiles u ON rr.user_id = u.user_id
       ORDER BY rr.created_at DESC`
    );
    return res.rows;
  }

  async approveRefundRequest(requestId: string) {
    const reqRes = await this.dbPool.query(`SELECT * FROM refund_requests WHERE id = $1`, [requestId]);
    if (reqRes.rows.length === 0) throw new Error('Refund request not found');
    const request = reqRes.rows[0];
    if (request.status !== 'PENDING') throw new Error('Refund request is not pending');

    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE refund_requests SET status = 'APPROVED', updated_at = NOW() WHERE id = $1`, [requestId]);
      await client.query(`UPDATE bookings SET current_status = 'CANCELLED' WHERE id = $1`, [request.booking_id]);
      
      // Look up payment details to mark partial refund for Click/Payme
      const paymentRes = await client.query('SELECT id, provider FROM payments WHERE booking_id = $1 AND status = $2', [request.booking_id, 'PAID']);
      if (paymentRes.rows.length > 0) {
        const paymentId = paymentRes.rows[0].id;
        const provider = paymentRes.rows[0].provider; // 'CLICK' or 'PAYME'
        
        // Mark payment as PARTIAL_REFUNDED
        await client.query("UPDATE payments SET status = 'PARTIAL_REFUNDED' WHERE id = $1", [paymentId]);

        // Create transaction to log the 80% refund to the user's card/gateway
        await client.query(
          `INSERT INTO transactions (id, payment_id, sender_user_id, receiver_user_id, amount, type)
           VALUES (uuid_generate_v4(), $1, NULL, $2, $3, 'REFUND')`,
          [paymentId, request.user_id, request.amount_to_refund]
        );
      } else {
        // Fallback internal refund if no payment record found
        await client.query(
          `INSERT INTO transactions (id, sender_user_id, receiver_user_id, amount, type)
           VALUES (uuid_generate_v4(), NULL, $1, $2, 'REFUND')`,
          [request.user_id, request.amount_to_refund]
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Refund request approved via Click/Payme' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getClientHistoryBookings(userId: string) {
    const res = await this.dbPool.query(
      `SELECT b.id, b.barber_id, b.scheduled_start, b.scheduled_end, b.current_status, b.payment_method, b.price,
              bp.business_name as usta, 'StyleMe Barbershop' as salon,
              EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) as is_reviewed
       FROM bookings b
       LEFT JOIN barber_profiles bp ON b.barber_id = bp.user_id
       WHERE b.user_id = $1 AND b.current_status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW')
       ORDER BY b.scheduled_start DESC
       LIMIT 50`,
      [userId]
    );

    return res.rows.map(row => {
      const date = new Date(row.scheduled_start);
      const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      const monthDay = date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
      const timeFormatted = `${monthDay}, ${timeStr}`;

      return {
        id: row.id,
        usta: row.usta || 'Sartarosh',
        salon: row.salon || 'Elite Barbershop',
        time: timeFormatted,
        price: row.price ? `${parseFloat(row.price).toLocaleString()} UZS` : '50,000 UZS',
        isReviewed: row.is_reviewed,
        barber_id: row.barber_id,
      };
    });
  }

  async cancelBooking(userId: string, bookingId: string) {
    const res = await this.dbPool.query(
      `SELECT scheduled_start, current_status FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, userId]
    );

    if (res.rows.length === 0) {
      throw new Error('Booking not found or access denied');
    }

    const booking = res.rows[0];

    if (booking.current_status !== 'PENDING' && booking.current_status !== 'CONFIRMED') {
      throw new Error('Faqat faol uchrashuvlarni bekor qilish mumkin');
    }

    const scheduledDate = new Date(booking.scheduled_start);
    const now = new Date();
    const diffHours = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 3) {
      throw new Error("Uchrashuvga 3 soatdan kam vaqt qolganda bekor qilib bo'lmaydi");
    }

    await this.dbPool.query(
      `UPDATE bookings SET current_status = 'CANCELLED' WHERE id = $1`,
      [bookingId]
    );

    return { success: true, message: 'Uchrashuv muvaffaqiyatli bekor qilindi' };
  }
}
