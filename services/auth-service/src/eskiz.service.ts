import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';

@Injectable()
export class EskizService {
  private readonly logger = new Logger(EskizService.name);
  private redis: Redis;

  private readonly ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
  private readonly ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
  private readonly ESKIZ_URL = 'https://notify.eskiz.uz/api';

  constructor(private readonly httpService: HttpService) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    if (!this.ESKIZ_EMAIL || !this.ESKIZ_PASSWORD) {
      this.logger.error('FATAL: Eskiz SMS credentials are missing from .env');
      throw new Error('FATAL: Eskiz SMS credentials are missing');
    }
  }

  /**
   * Retrieves an Eskiz Bearer token. Uses Redis to cache it for 29 days (Eskiz tokens live 30 days).
   */
  private async getToken(): Promise<string> {
    const cachedToken = await this.redis.get('eskiz_token');
    if (cachedToken) {
      return cachedToken;
    }

    if (!this.ESKIZ_EMAIL || !this.ESKIZ_PASSWORD) {
      this.logger.error('Eskiz credentials missing from .env. Cannot retrieve token.');
      throw new Error('SMS configuration error.');
    }

    try {
      const loginData = new URLSearchParams();
      loginData.append('email', this.ESKIZ_EMAIL);
      loginData.append('password', this.ESKIZ_PASSWORD);

      const response = await firstValueFrom(
        this.httpService.post(`${this.ESKIZ_URL}/auth/login`, loginData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      const token = response.data.data.token;
      
      // Cache token for 29 days (2505600 seconds)
      await this.redis.set('eskiz_token', token, 'EX', 2505600);
      return token;
    } catch (error) {
      this.logger.error('Failed to get Eskiz Token', error.response?.data || error.message);
      throw new Error('SMS service is currently unavailable.');
    }
  }

  /**
   * Sends an SMS via Eskiz
   */
  async sendSms(phone: string, message: string): Promise<boolean> {
    if (!this.ESKIZ_EMAIL || !this.ESKIZ_PASSWORD) {
      this.logger.error('SMS configuration is missing. Cannot send SMS.');
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, ''); // Extract only digits
    if (cleanPhone.length !== 12) {
      this.logger.error(`Invalid phone number format: ${cleanPhone}`);
      return false; // Valid UZ number is 12 digits (998901234567)
    }

    try {
      const token = await this.getToken();
      
      const formData = new URLSearchParams();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', message);
      formData.append('from', '4546'); // Default Eskiz shortcode

      await firstValueFrom(
        this.httpService.post(`${this.ESKIZ_URL}/message/sms/send`, formData.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      this.logger.log(`SMS sent successfully to ${cleanPhone}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS via Eskiz', error.response?.data || error.message);
      return false;
    }
  }
}
