import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private redis: Redis;
  private readonly OTP_TTL = 300; // 5 minutes in seconds
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Generates a 6-digit OTP code and stores it in Redis
   */
  async generateOtp(phone: string): Promise<string> {
    // Generate a 6 digit random number
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if user is repeatedly asking for OTP
    const resendsKey = `otp_resends:${phone}`;
    let resends = await this.redis.get(resendsKey);
    
    if (resends && parseInt(resends, 10) >= 3) {
      throw new HttpException('Too many OTP requests. Please wait 10 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Set OTP and reset attempts
    await this.redis.set(`otp:${phone}`, code, 'EX', this.OTP_TTL);
    await this.redis.set(`otp_attempts:${phone}`, 0, 'EX', this.OTP_TTL);
    
    // Increment resend counter
    if (!resends) {
      await this.redis.set(resendsKey, 1, 'EX', 600); // 10 minutes block if hit 3 times
    } else {
      await this.redis.incr(resendsKey);
    }

    return code;
  }

  /**
   * Verifies an OTP code
   */
  async verifyOtp(phone: string, inputCode: string): Promise<boolean> {
    const attemptsKey = `otp_attempts:${phone}`;
    const otpKey = `otp:${phone}`;

    const attempts = await this.redis.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= this.MAX_ATTEMPTS) {
      await this.redis.del(otpKey);
      throw new HttpException('Too many invalid attempts. Request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const storedCode = await this.redis.get(otpKey);
    if (!storedCode) {
      throw new HttpException('OTP expired or not requested', HttpStatus.BAD_REQUEST);
    }

    if (storedCode !== inputCode) {
      await this.redis.incr(attemptsKey);
      throw new HttpException('Invalid OTP code', HttpStatus.BAD_REQUEST);
    }

    // Success! Clear the OTP so it can't be reused
    await this.redis.del(otpKey);
    await this.redis.del(attemptsKey);
    
    // Set a verification token to allow signup/login within next 5 mins
    const verifyToken = Math.random().toString(36).substring(2, 15);
    await this.redis.set(`otp_verified:${phone}`, verifyToken, 'EX', 300);

    return true;
  }

  /**
   * Check if a phone number was recently verified
   */
  async isPhoneVerified(phone: string): Promise<boolean> {
    const isVerified = await this.redis.get(`otp_verified:${phone}`);
    return !!isVerified;
  }

  /**
   * Consume the verification so it can't be reused for multiple signups
   */
  async consumeVerification(phone: string): Promise<void> {
    await this.redis.del(`otp_verified:${phone}`);
  }
}
