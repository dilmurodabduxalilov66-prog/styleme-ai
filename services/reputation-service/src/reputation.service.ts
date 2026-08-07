import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';

@Injectable()
export class ReputationService implements OnModuleInit {
  private dbPool: Pool;
  private redis: Redis;

  constructor() {
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://styleme_user:styleme_password@localhost:5432/styleme_db',
    });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleInit() {
    this.runQueueWorker().catch(err => {
      console.error('Failed to run reputation queue worker:', err);
    });
  }

  async runQueueWorker() {
    console.log('[REPUTATION WORKER] Worker daemon started.');
    while (true) {
      try {
        const result = await this.redis.blpop('jobs:recalculate_reputation', 5);
        if (result) {
          const [_, barberId] = result;
          console.log(`[REPUTATION WORKER] Recalculating reputation for barber: ${barberId}`);
          await this.calculateReputationSynchronously(barberId);
          console.log(`[REPUTATION WORKER] Completed reputation recalculation for barber: ${barberId}`);
        }
      } catch (err) {
        console.error('[REPUTATION WORKER] Error processing queue job:', err.message);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // ============================================================================
  // Get Barber Reputation Status
  // ============================================================================
  async getBarberReputation(barberId: string) {
    const client = await this.dbPool.connect();
    try {
      // 1. Fetch Ranking
      const rankRes = await client.query(
        'SELECT raw_score, rank_grade, completed_bookings_count, complaint_rate FROM barber_rankings WHERE barber_id = $1',
        [barberId]
      );
      
      let ranking = null;
      if (rankRes.rows.length > 0) {
        ranking = {
          rawScore: parseFloat(rankRes.rows[0].raw_score),
          grade: rankRes.rows[0].rank_grade,
          totalBookings: rankRes.rows[0].completed_bookings_count,
          cancellationRate: parseFloat(rankRes.rows[0].complaint_rate)
        };
      } else {
        // Default ranking for new barbers
        ranking = {
          rawScore: 0.0,
          grade: 'C',
          totalBookings: 0,
          cancellationRate: 0.0
        };
      }

      // 2. Fetch Recent Reviews
      const reviewRes = await client.query(
        `SELECT r.id, up.first_name || ' ' || up.last_name as name, r.rating, r.comment, r.created_at
         FROM reviews r
         LEFT JOIN user_profiles up ON r.user_id = up.user_id
         WHERE r.barber_id = $1
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [barberId]
      );

      const reviews = reviewRes.rows.map(row => ({
        id: row.id,
        name: row.name || 'Mijoz',
        rating: row.rating,
        comment: row.comment,
        date: new Date(row.created_at).toLocaleString('uz-UZ')
      }));

      return { ranking, reviews };
    } catch (err) {
      throw new InternalServerErrorException(err.message || 'Failed to fetch reputation data.');
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Recalculate Barber Reputation Score & Rank Grade (Asynchronous API entrypoint)
  // ============================================================================
  async recalculateBarberReputation(barberId: string) {
    try {
      await this.redis.rpush('jobs:recalculate_reputation', barberId);
      return { success: true, message: 'Reputation recalculation queued.', status: 'ACCEPTED' };
    } catch (err) {
      throw new InternalServerErrorException('Failed to queue reputation recalculation job.');
    }
  }

  // ============================================================================
  // Submit a Review (Called by client)
  // ============================================================================
  async submitReview(userId: string, bookingId: number, barberId: string, rating: number, comment: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert review
      await client.query(
        `INSERT INTO reviews (user_id, barber_id, booking_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, barberId, bookingId, rating, comment]
      );

      // Add loyalty points to the user (+5)
      await client.query(
        `INSERT INTO user_loyalty (user_id, points) VALUES ($1, 5)
         ON CONFLICT (user_id) DO UPDATE SET points = user_loyalty.points + 5`,
        [userId]
      );

      await client.query('COMMIT');
      
      // Recalculate barber reputation in background
      this.recalculateBarberReputation(barberId).catch(console.error);
      
      return { success: true, message: 'Review submitted successfully and points added.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new InternalServerErrorException(err.message || 'Failed to submit review.');
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Synchronous Calculations (Invoked by worker)
  // ============================================================================
  async calculateReputationSynchronously(barberId: string) {
    const client = await this.dbPool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Fetch Ratings Data (v = count, R_avg = average)
      const reviewRes = await client.query(
        `SELECT COUNT(id) as review_count, COALESCE(AVG(rating), 4.5) as avg_rating 
         FROM reviews WHERE barber_id = $1`,
        [barberId]
      );
      const reviewCount = parseInt(reviewRes.rows[0].review_count, 10);
      const avgRating = parseFloat(reviewRes.rows[0].avg_rating);

      // 2. Fetch Bookings and Loyalty Metrics
      const completedRes = await client.query(
        `SELECT COUNT(id) as completed_count 
         FROM bookings 
         WHERE barber_id = $1 AND current_status = 'COMPLETED'`,
        [barberId]
      );
      const completedCount = parseInt(completedRes.rows[0].completed_count, 10);

      // Unique Clients & Repeat Clients count
      // A repeat client has booked this barber >= 2 times in the last 90 days
      const totalClientsRes = await client.query(
        `SELECT COUNT(DISTINCT user_id) as total_clients 
         FROM bookings 
         WHERE barber_id = $1 AND current_status = 'COMPLETED'`,
        [barberId]
      );
      const totalClients = parseInt(totalClientsRes.rows[0].total_clients, 10);

      const repeatClientsRes = await client.query(
        `SELECT COUNT(*) as repeat_count FROM (
          SELECT user_id FROM bookings 
          WHERE barber_id = $1 AND current_status = 'COMPLETED' AND scheduled_start >= NOW() - INTERVAL '90 days'
          GROUP BY user_id HAVING COUNT(id) >= 2
        ) AS repeat_set`,
        [barberId]
      );
      const repeatClients = parseInt(repeatClientsRes.rows[0].repeat_count, 10);

      // 3. Fetch Penalties (Cancellations in last 24h & verified complaints)
      const cancellationsRes = await client.query(
        `SELECT COUNT(id) as cancel_count 
         FROM booking_status_history 
         WHERE changed_by = $1 AND status_to = 'CANCELLED' AND changed_at >= NOW() - INTERVAL '30 days'`,
        [barberId]
      );
      const cancellations = parseInt(cancellationsRes.rows[0].cancel_count, 10);

      const complaintsRes = await client.query(
        `SELECT COUNT(id) as complaint_count 
         FROM reports_complaints 
         WHERE reported_barber_id = $1 AND status = 'RESOLVED' AND issue_type IN ('ABUSE', 'POOR_HYGIENE', 'UNSANITARY')`,
        [barberId]
      );
      const complaints = parseInt(complaintsRes.rows[0].complaint_count, 10);

      // 4. Fetch Tenure (Days since user account creation)
      const tenureRes = await client.query(
        'SELECT created_at FROM users WHERE id = $1', [barberId]
      );
      const createdAt = new Date(tenureRes.rows[0].created_at);
      const tenureDays = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

      // 5. Fetch Activity Consistency (Active weeks in last 12 weeks with >=3 bookings)
      const consistencyRes = await client.query(
        `SELECT COUNT(DISTINCT DATE_TRUNC('week', scheduled_start)) as active_weeks
         FROM bookings
         WHERE barber_id = $1 AND current_status = 'COMPLETED' AND scheduled_start >= NOW() - INTERVAL '12 weeks'
         GROUP BY DATE_TRUNC('week', scheduled_start)
         HAVING COUNT(id) >= 3`,
        [barberId]
      );
      const activeWeeks = consistencyRes.rows.length;

      // ============================================================================
      // MATH CALCULATIONS
      // ============================================================================
      
      // A. Bayesian Smoothing Rating
      const m = 15; // Prior weight
      const C = 4.5; // Prior mean
      const bayesianRating = ((reviewCount * avgRating) + (m * C)) / (reviewCount + m);
      const bayesianNormalized = (bayesianRating - 1.0) * 25.0; // Normalise 1-5 to 0-100

      // B. Loyalty Score
      const loyaltyScore = (repeatClients / (totalClients + 1)) * 100.0;

      // C. Activity Consistency Score
      const activityScore = (activeWeeks / 12.0) * 100.0;

      // D. Tenure Score
      const tenureScore = Math.min(100.0, (Math.log(tenureDays + 1) / Math.log(365)) * 100.0);

      // E. Trust Multiplier (Throttling Ceiling)
      const cancelPenalty = (cancellations / (completedCount + 1)) * 2.0;
      const complaintPenalty = (complaints / (completedCount + 1)) * 5.0;
      const trustMultiplier = Math.max(0.00, 1.00 - cancelPenalty - complaintPenalty);

      // F. Final Reputation Score
      const rawScore = trustMultiplier * (
        (0.45 * bayesianNormalized) +
        (0.25 * loyaltyScore) +
        (0.20 * activityScore) +
        (0.10 * tenureScore)
      );

      // ============================================================================
      // RANK TIER PROGRESSION & CAP LIMITS (Uzbekistan 5% S-rank Cap)
      // ============================================================================
      let rankGrade = 'C';
      if (rawScore >= 93.0 && completedCount >= 150 && trustMultiplier >= 0.98 && complaints === 0) {
        rankGrade = 'S';
      } else if (rawScore >= 83.0 && completedCount >= 50 && trustMultiplier >= 0.95) {
        rankGrade = 'A';
      } else if (rawScore >= 70.0 && completedCount >= 20 && trustMultiplier >= 0.90) {
        rankGrade = 'B';
      } else if (rawScore >= 50.0) {
        rankGrade = 'C';
      } else if (rawScore >= 35.0) {
        rankGrade = 'D';
      } else if (rawScore >= 20.0) {
        rankGrade = 'E';
      } else {
        rankGrade = 'F';
      }

      // Check S-Rank regional exclusivity cap (Max 5% of active barbers can hold S-rank)
      if (rankGrade === 'S') {
        const totalActiveRes = await client.query(
          'SELECT COUNT(user_id) as total FROM barber_profiles WHERE is_available = TRUE'
        );
        const totalActive = parseInt(totalActiveRes.rows[0].total, 10);

        const totalSRes = await client.query(
          "SELECT COUNT(barber_id) as total FROM barber_rankings WHERE rank_grade = 'S' AND barber_id != $1",
          [barberId]
        );
        const totalS = parseInt(totalSRes.rows[0].total, 10);

        // Calculate if adding this barber exceeds the 5% cap
        if (totalActive > 0 && ((totalS + 1) / totalActive) > 0.05) {
          // Exceeds cap. Demote to A-Rank with warning
          rankGrade = 'A';
          console.log(`[CAP LIMIT] Barber ${barberId} raw score qualifies for S-Rank (${rawScore}), but was capped at A-Rank due to regional 5% cap.`);
        }
      }

      // 6. Update database record
      await client.query(
        `INSERT INTO barber_rankings (barber_id, raw_score, rank_grade, completed_bookings_count, repeat_customer_rate, complaint_rate, activity_consistency_score, last_recalculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (barber_id) DO UPDATE
         SET raw_score = EXCLUDED.raw_score,
             rank_grade = EXCLUDED.rank_grade,
             completed_bookings_count = EXCLUDED.completed_bookings_count,
             repeat_customer_rate = EXCLUDED.repeat_customer_rate,
             complaint_rate = EXCLUDED.complaint_rate,
             activity_consistency_score = EXCLUDED.activity_consistency_score,
             last_recalculated_at = CURRENT_TIMESTAMP;`,
        [
          barberId,
          rawScore.toFixed(2),
          rankGrade,
          completedCount,
          loyaltyScore.toFixed(2),
          (complaints / (completedCount + 1) * 100).toFixed(2),
          activityScore.toFixed(2)
        ]
      );

      // Log to rank history
      await client.query(
        'INSERT INTO rank_history (barber_id, raw_score, rank_grade) VALUES ($1, $2, $3)',
        [barberId, rawScore.toFixed(2), rankGrade]
      );

      await client.query('COMMIT');
      return { barberId, rawScore: rawScore.toFixed(2), rankGrade };

    } catch (err) {
      await client.query('ROLLBACK');
      throw new InternalServerErrorException(err.message || 'Reputation recalculation failed.');
    } finally {
      client.release();
    }
  }
}
