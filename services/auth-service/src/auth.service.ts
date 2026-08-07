import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private dbPool: Pool;
  private redis: Redis;

  constructor(private jwtService: JwtService) {
    if (!process.env.DATABASE_URL) throw new Error('FATAL: DATABASE_URL is missing from .env');
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) throw new Error('FATAL: JWT secrets missing');
    
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // ============================================================================
  // Login Rate Limiter Guard
  // ============================================================================
  private async checkRateLimit(username: string): Promise<void> {
    const key = `login_attempts:${username}`;
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts, 10) >= 5) {
      throw new HttpException(
        'Too many failed login attempts. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async incrementRateLimit(username: string): Promise<void> {
    const key = `login_attempts:${username}`;
    const attempts = await this.redis.get(key);
    
    if (!attempts) {
      await this.redis.set(key, 1, 'EX', 900); // 15 minutes expiry
    } else {
      await this.redis.incr(key);
    }
  }

  private async clearRateLimit(username: string): Promise<void> {
    const key = `login_attempts:${username}`;
    await this.redis.del(key);
  }

  // ============================================================================
  // Signup Logic
  // ============================================================================
  async signup(email: string, phone: string, password: string, role: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await this.dbPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert user
      const userRes = await client.query(
        `INSERT INTO users (email, phone_number, password_hash) 
         VALUES ($1, $2, $3) RETURNING id, email, phone_number`,
        [email || null, phone || null, hashedPassword]
      );
      
      const userId = userRes.rows[0].id;

      // Fetch role ID
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleRes.rows.length === 0) {
        throw new HttpException('Specified role does not exist', HttpStatus.BAD_REQUEST);
      }
      const roleId = roleRes.rows[0].id;

      // Assign user role
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, roleId]
      );

      // Create base profile shell
      await client.query(
        'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)',
        [userId, 'New', 'User']
      );

      await client.query('COMMIT');
      
      return {
        user_id: userId,
        email: userRes.rows[0].email,
        phone_number: userRes.rows[0].phone_number,
        role,
        is_active: true
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err.code === '23505' && err.constraint === 'users_phone_number_key') {
        throw new HttpException('Ushbu telefon raqami orqali allaqachon ro\'yxatdan o\'tilgan. Iltimos, tizimga kiring.', HttpStatus.CONFLICT);
      }
      if (err.code === '23505' && err.constraint === 'users_email_key') {
        throw new HttpException('Ushbu elektron pochta orqali allaqachon ro\'yxatdan o\'tilgan. Iltimos, tizimga kiring.', HttpStatus.CONFLICT);
      }
      throw new HttpException(
        err.message || 'Error occurred during signup.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Login Logic
  // ============================================================================
  async login(username: string, password_raw: string) {
    await this.checkRateLimit(username);

    const res = await this.dbPool.query(
      `SELECT u.id, u.email, u.phone_number, u.password_hash, u.is_active, r.name as role
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1 OR u.phone_number = $1`,
      [username]
    );

    if (res.rows.length === 0) {
      await this.incrementRateLimit(username);
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = res.rows[0];
    if (!user.is_active) {
      throw new HttpException('User account is suspended.', HttpStatus.FORBIDDEN);
    }

    const passwordMatch = await bcrypt.compare(password_raw, user.password_hash);
    if (!passwordMatch) {
      await this.incrementRateLimit(username);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success
    await this.clearRateLimit(username);
    return this.generateTokens(user.id, user.email, user.role);
  }

  // ============================================================================
  // Token Generation & Refresh Token Rotation (RTR)
  // ============================================================================
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_ACCESS_SECRET
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_REFRESH_SECRET
    });

    // Store active refresh token in Redis
    await this.redis.set(`refresh_token:${userId}`, refresh_token, 'EX', 30 * 24 * 60 * 60);

    return {
      access_token,
      expires_in: 900,
      refresh_token
    };
  }

  async refresh(refreshTokenRaw: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenRaw, {
        secret: process.env.JWT_REFRESH_SECRET
      });

      const userId = payload.sub;
      const storedToken = await this.redis.get(`refresh_token:${userId}`);

      if (!storedToken) {
        throw new UnauthorizedException('Token expired or session terminated');
      }

      // RTR Theft Detection: If token doesn't match the active stored one
      if (storedToken !== refreshTokenRaw) {
        await this.redis.del(`refresh_token:${userId}`); // Invalidate all sessions (breach mitigation)
        throw new UnauthorizedException('Token theft detected. Session invalidated.');
      }

      // Generate a new rotated token pair
      return this.generateTokens(userId, payload.email, payload.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const res = await this.dbPool.query(
      `SELECT up.first_name, up.last_name, up.avatar_url, up.hair_profile, up.preferred_language, u.email, u.phone_number, u.subscription_plan
       FROM user_profiles up
       JOIN users u ON up.user_id = u.id
       WHERE up.user_id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    // Get loyalty points from user_loyalty table
    const loyaltyRes = await this.dbPool.query(
      `SELECT points FROM user_loyalty WHERE user_id = $1`,
      [userId]
    );
    const earnedPoints = loyaltyRes.rows.length > 0 ? loyaltyRes.rows[0].points : 0;
    const loyaltyPoints = 100 + earnedPoints; // Base 100 points + earned points

    // Get the latest AI analysis result
    const aiRes = await this.dbPool.query(
      `SELECT face_shape, created_at 
       FROM ai_analysis_results 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );
    const faceShape = aiRes.rows.length > 0 ? aiRes.rows[0].face_shape : null;

    // Get all past scans
    const scansRes = await this.dbPool.query(
      `SELECT id, face_shape as name, raw_image_url as img, created_at as date
       FROM ai_analysis_results 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const pastScans = scansRes.rows.map(row => {
      const date = new Date(row.date);
      const dateString = date.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return {
        id: row.id,
        name: `${row.name} yuz shakli`,
        date: dateString,
        img: row.img
      };
    });

    return {
      ...res.rows[0],
      face_shape: faceShape,
      loyalty_points: loyaltyPoints,
      past_scans: pastScans
    };
  }

  async getFavorites(userId: string) {
    // We cast favoritable_id to UUID if needed, but it's now VARCHAR in our ideal schema. 
    // Wait, the hairstyle_catalog id is INT. We can cast it back to int.
    const favStylesRes = await this.dbPool.query(
      `SELECT h.id, h.name_translations->>'uz' as name, h.reference_image_url as img, 90 as match 
       FROM favorites f 
       JOIN hairstyle_catalog h ON f.favoritable_id = h.id::text 
       WHERE f.user_id = $1 AND f.favoritable_type = 'HAIRSTYLE'`,
      [userId]
    );

    const favBarbersRes = await this.dbPool.query(
      `SELECT b.id, b.first_name || ' ' || b.last_name as name, 'A-Rank' as rank, '5.0' as rating, '2 km' as distance, b.avatar_url as img 
       FROM favorites f 
       JOIN users b ON f.favoritable_id = b.id::text 
       WHERE f.user_id = $1 AND f.favoritable_type = 'BARBER'`,
      [userId]
    );

    return {
      savedStyles: favStylesRes.rows,
      favBarbers: favBarbersRes.rows
    };
  }

  async toggleFavorite(userId: string, type: string, targetId: string) {
    const checkRes = await this.dbPool.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND favoritable_type = $2 AND favoritable_id = $3`,
      [userId, type, targetId]
    );

    if (checkRes.rows.length > 0) {
      await this.dbPool.query(
        `DELETE FROM favorites WHERE id = $1`,
        [checkRes.rows[0].id]
      );
      return { status: 'removed' };
    } else {
      await this.dbPool.query(
        `INSERT INTO favorites (user_id, favoritable_type, favoritable_id) VALUES ($1, $2, $3)`,
        [userId, type, targetId]
      );
      return { status: 'added' };
    }
  }

  async updateSettings(userId: string, data: any) {
    const profileRes = await this.dbPool.query(`SELECT hair_profile FROM user_profiles WHERE user_id = $1`, [userId]);
    let hairProfile = profileRes.rows[0]?.hair_profile || {};
    hairProfile = { ...hairProfile, ...data };
    
    await this.dbPool.query(
      `UPDATE user_profiles SET hair_profile = $1 WHERE user_id = $2`,
      [hairProfile, userId]
    );
    return { success: true };
  }

  async getTriageComplaints() {
    const res = await this.dbPool.query(
      `SELECT 
         c.id, 
         c.issue_type as reason, 
         c.details,
         c.status,
         ROUND(EXTRACT(EPOCH FROM (c.created_at + INTERVAL '72 hours' - NOW()))/3600) as sla_hours_left,
         c.created_at,
         u1.first_name || ' ' || u1.last_name as client_name,
         u2.first_name || ' ' || u2.last_name as barber_name
       FROM reports_complaints c
       LEFT JOIN users u1 ON c.reporter_id = u1.id
       LEFT JOIN users u2 ON c.reported_barber_id = u2.id
       ORDER BY c.created_at DESC
       LIMIT 50`
    );

    const complaints = res.rows.map(row => ({
      id: row.id,
      clientName: row.client_name || 'Noma\'lum',
      barberName: row.barber_name || 'Noma\'lum',
      bookingTime: new Date(row.created_at).toLocaleString('uz-UZ'),
      reason: row.reason,
      details: row.details || 'Qo\'shimcha izoh qoldirilmagan',
      slaHoursLeft: parseInt(row.sla_hours_left) || 0,
      status: row.status,
      amount: '0 UZS'
    }));

    return { complaints };
  }

  async resolveTriageComplaint(id: string, action: string) {
    const status = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    await this.dbPool.query(
      `UPDATE reports_complaints SET status = $1 WHERE id = $2`,
      [status, id]
    );
    return { success: true, status };
  }

  async upgradeSubscription(userId: string, plan: string) {
    if (!['FREE', 'PRO_MONTHLY', 'PRO_YEARLY'].includes(plan)) {
      throw new HttpException('Invalid subscription plan', HttpStatus.BAD_REQUEST);
    }
    await this.dbPool.query(
      `UPDATE users SET subscription_plan = $1 WHERE id = $2`,
      [plan, userId]
    );
    return { success: true, plan };
  }

  async findUserByPhone(phone: string) {
    const res = await this.dbPool.query(
      `SELECT id, email, phone_number FROM users WHERE phone_number = $1 OR email = $1`,
      [phone]
    );
    return res.rows[0] || null;
  }

  async getUserById(userId: string) {
    const res = await this.dbPool.query(
      `SELECT id, email, phone_number FROM users WHERE id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async resetPassword(phone: string, newPasswordRaw: string) {
    const hashedPassword = await bcrypt.hash(newPasswordRaw, 10);
    const res = await this.dbPool.query(
      `UPDATE users SET password_hash = $1 WHERE phone_number = $2 OR email = $2 RETURNING id`,
      [hashedPassword, phone]
    );
    if (res.rows.length === 0) {
      throw new HttpException('Foydalanuvchi topilmadi', HttpStatus.NOT_FOUND);
    }
    return { success: true, message: 'Parol muvaffaqiyatli tiklandi' };
  }
}
