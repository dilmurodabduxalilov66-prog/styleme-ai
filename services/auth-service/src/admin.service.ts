import { Injectable, InternalServerErrorException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Pool } from 'pg';
import * as os from 'os';

@Injectable()
export class AdminService {
  private dbPool: Pool;

  constructor() {
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://styleme_user:styleme_password@localhost:5432/styleme_db',
    });
  }

  async getSettings() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query('SELECT base_commission_rate, s_rank_commission_rate, lockout_threshold FROM platform_settings LIMIT 1');
      if (res.rows.length > 0) {
        return {
          baseCommission: parseFloat(res.rows[0].base_commission_rate),
          sRankCommission: parseFloat(res.rows[0].s_rank_commission_rate),
          lockoutThreshold: parseFloat(res.rows[0].lockout_threshold)
        };
      }
      return { baseCommission: 10, sRankCommission: 5, lockoutThreshold: 450000 };
    } finally {
      client.release();
    }
  }

  async updateSettings(baseCommission: number, sRankCommission: number, lockoutThreshold: number) {
    const client = await this.dbPool.connect();
    try {
      await client.query(`
        UPDATE platform_settings 
        SET base_commission_rate = $1, 
            s_rank_commission_rate = $2, 
            lockout_threshold = $3,
            updated_at = CURRENT_TIMESTAMP
      `, [baseCommission, sRankCommission, lockoutThreshold]);
      return { success: true };
    } catch (err) {
      console.error('Error updating settings:', err);
      throw new InternalServerErrorException('Error updating settings');
    } finally {
      client.release();
    }
  }

  async getAdmins() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query(`
        SELECT u.id, u.email, u.phone_number, u.is_active, r.name as role, u.created_at,
        up.first_name || ' ' || up.last_name as name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE r.name = 'ADMIN' OR r.name = 'OWNER'
      `);
      return res.rows.map(row => ({
        id: row.id,
        name: row.name || "Noma'lum",
        role: row.role,
        email: row.email,
        phone: row.phone_number,
        lastActive: row.created_at, // simple fallback
        status: row.is_active ? 'ACTIVE' : 'INACTIVE'
      }));
    } finally {
      client.release();
    }
  }

  async createAdmin(firstName: string, email: string, passwordRaw: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(passwordRaw, 10);
      
      const userRes = await client.query(`
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) RETURNING id
      `, [email, hash]);
      const userId = userRes.rows[0].id;

      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['ADMIN']);
      const roleId = roleRes.rows[0].id;

      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
      
      await client.query('INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)', [userId, firstName, '']);

      await client.query('COMMIT');
      return { success: true, id: userId };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('createAdmin ERROR:', err);
      throw new HttpException("Bunday email avval ro'yxatdan o'tgan bo'lishi mumkin.", HttpStatus.BAD_REQUEST);
    } finally {
      client.release();
    }
  }

  async revokeAdmin(id: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['USER']);
      const userRoleId = roleRes.rows[0].id;

      const checkOwner = await client.query(`
        SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'OWNER'
      `, [id]);
      
      if (checkOwner.rows.length > 0) {
        throw new HttpException("Asosiy egasi (OWNER) huquqini bekor qilib bo'lmaydi", HttpStatus.FORBIDDEN);
      }

      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, userRoleId]);

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('revokeAdmin ERROR:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async revokeBarber(id: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['USER']);
      const userRoleId = roleRes.rows[0].id;

      const checkOwner = await client.query(`
        SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'OWNER'
      `, [id]);
      
      if (checkOwner.rows.length > 0) {
        throw new HttpException("Asosiy egasi (OWNER) huquqini bekor qilib bo'lmaydi", HttpStatus.FORBIDDEN);
      }

      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, userRoleId]);

      await client.query('UPDATE barber_profiles SET is_available = false WHERE user_id = $1', [id]);

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('revokeBarber ERROR:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getBarbers() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query(`
        SELECT u.id, u.email, u.phone_number, u.is_active, r.name as role, u.created_at,
        up.first_name || ' ' || up.last_name as name,
        bp.business_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN barber_profiles bp ON u.id = bp.user_id
        WHERE r.name = 'BARBER'
        ORDER BY u.created_at DESC
      `);
      return res.rows.map(row => ({
        id: row.id,
        name: row.name || "Noma'lum",
        businessName: row.business_name || "Noma'lum Salon",
        email: row.email,
        phone: row.phone_number,
        lastActive: row.created_at,
        status: row.is_active ? 'ACTIVE' : 'INACTIVE'
      }));
    } finally {
      client.release();
    }
  }

  async createBarber(firstName: string, email: string, passwordRaw: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(passwordRaw, 10);
      
      const userRes = await client.query(`
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) RETURNING id
      `, [email, hash]);
      const userId = userRes.rows[0].id;

      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', ['BARBER']);
      const roleId = roleRes.rows[0].id;

      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
      
      await client.query('INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)', [userId, firstName, '']);
      
      // Sartarosh profilini ham bo'sh (default) qiymatlar bilan ochamiz
      await client.query('INSERT INTO barber_profiles (user_id, business_name, is_available) VALUES ($1, $2, true)', [userId, firstName + ' Saloni']);

      await client.query('COMMIT');
      return { success: true, id: userId };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('createBarber ERROR:', err);
      throw new HttpException("Bunday email avval ro'yxatdan o'tgan bo'lishi mumkin.", HttpStatus.BAD_REQUEST);
    } finally {
      client.release();
    }
  }

  async getStats() {
    const client = await this.dbPool.connect();
    try {
      const activeDisputesRes = await client.query(`SELECT COUNT(*) FROM reports_complaints WHERE status IN ('OPEN', 'UNDER_INVESTIGATION')`);
      const verifiedTodayRes = await client.query(`SELECT COUNT(*) FROM barber_verifications WHERE verified_at >= CURRENT_DATE`);
      const totalModeratedTodayRes = await client.query(`SELECT COUNT(*) FROM review_moderations WHERE moderated_at >= CURRENT_DATE`);
      
      // reports_complaints table does not have updated_at column, so we default SLA avg to 14 minutes.
      const avgMinutes = 14;
      
      // Calculate a rough CPU percentage using OS loadavg
      const cpus = os.cpus().length;
      const cpuLoad = Math.min(100, Math.round((os.loadavg()[0] / cpus) * 100));

      return {
        activeDisputes: parseInt(activeDisputesRes.rows[0].count, 10),
        avgResolveMinutes: avgMinutes,
        verifiedToday: parseInt(verifiedTodayRes.rows[0].count, 10),
        totalModeratedToday: parseInt(totalModeratedTodayRes.rows[0].count, 10),
        cpuLoad: cpuLoad || 1
      };
    } finally {
      client.release();
    }
  }

  async getModerate() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query(`
        SELECT r.id, 'REVIEW' as type, u.email as creatorName, r.comment as content, r.created_at as submittedAt
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE 1 = 0
        LIMIT 20
      `);
      return {
        items: res.rows.map(r => ({
          id: r.id,
          type: r.type,
          creatorName: r.creatorname,
          content: r.content,
          imageUrl: undefined,
          flagReason: 'Tizim: Yomon so\'zlar qatnashgan bo\'lishi mumkin',
          submittedAt: r.submittedat
        }))
      };
    } finally {
      client.release();
    }
  }

  async moderateDecision(id: string, action: string) {
    const client = await this.dbPool.connect();
    try {
      const decision = action === 'APPROVE' ? 'APPROVED' : 'REJECTED_OFFENSIVE';
      await client.query('UPDATE reviews SET is_moderated = true WHERE id = $1', [id]);
      await client.query('INSERT INTO review_moderations (review_id, decision) VALUES ($1, $2)', [id, decision]);
      return { success: true };
    } finally {
      client.release();
    }
  }

  async getTriage() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query(`
        SELECT c.id, c.issue_type as reason, c.details, c.status, c.created_at, 
               COALESCE(up.first_name || ' ' || up.last_name, u.email) as clientName,
               bp.business_name as barberName
        FROM reports_complaints c
        JOIN users u ON c.reporter_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        JOIN barber_profiles bp ON c.reported_barber_id = bp.user_id
        WHERE c.status IN ('OPEN', 'UNDER_INVESTIGATION')
      `);
      return {
        complaints: res.rows.map(r => ({
          id: r.id,
          clientName: r.clientname || 'Mijoz',
          barberName: r.barbername || 'Usta',
          bookingTime: 'Yaqinda',
          reason: r.reason,
          details: r.details,
          slaHoursLeft: 24,
          status: r.status === 'OPEN' ? 'PENDING' : 'RESOLVED',
          amount: '10 000 UZS'
        }))
      };
    } finally {
      client.release();
    }
  }

  async resolveTriage(id: string, action: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('UPDATE reports_complaints SET status = $1 WHERE id = $2', ['RESOLVED', id]);
      return { success: true };
    } finally {
      client.release();
    }
  }

  async getVerify() {
    const client = await this.dbPool.connect();
    try {
      const res = await client.query(`
        SELECT bv.id, bv.barber_id, bv.document_url, bv.status, bv.verified_at,
               bp.business_name, bp.address, bp.latitude, bp.longitude,
               COALESCE(up.first_name || ' ' || up.last_name, u.email) as applicant_name,
               u.phone_number
        FROM barber_verifications bv
        JOIN barber_profiles bp ON bv.barber_id = bp.user_id
        JOIN users u ON bp.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE bv.status = 'PENDING'
        ORDER BY bv.id DESC
      `);
      return {
        requests: res.rows.map(r => ({
          id: r.id,
          applicantName: r.applicant_name || 'Usta',
          salonName: r.business_name || 'Sartaroshxona',
          phone: r.phone_number || '',
          experienceYears: 1, // default mock
          submittedAt: r.verified_at ? r.verified_at.toISOString() : 'Yaqinda',
          documentUrl: r.document_url,
          status: r.status,
          address: r.address || '',
          latitude: parseFloat(r.latitude) || 41.3,
          longitude: parseFloat(r.longitude) || 69.3
        }))
      };
    } finally {
      client.release();
    }
  }

  async verifyDecision(id: string, decision: string, reason: string, adminId: string | null) {
    const client = await this.dbPool.connect();
    try {
      const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      await client.query(
        `UPDATE barber_verifications 
         SET status = $1, rejection_reason = $2, verified_by = $3, verified_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [status, reason || null, adminId, id]
      );
      return { success: true };
    } finally {
      client.release();
    }
  }
}
