import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/auth.module';
import Redis from 'ioredis';

describe('SMS Integration & OTP Flows (e2e)', () => {
  let app: INestApplication;
  let redisClient: Redis;

  beforeAll(async () => {
    // Override env for test
    process.env.ESKIZ_EMAIL = 'test@eskiz.uz';
    process.env.ESKIZ_PASSWORD = 'test_password';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  });

  afterAll(async () => {
    await redisClient.quit();
    await app.close();
  });

  describe('OTP Generation and Verification', () => {
    const testPhone = '998901234567';

    beforeEach(async () => {
      // Clear specific redis keys before each test
      await redisClient.del(`otp_resends:${testPhone}`);
      await redisClient.del(`otp_attempts:${testPhone}`);
      await redisClient.del(`otp:${testPhone}`);
      await redisClient.del(`otp_verified:${testPhone}`);
    });

    it('/api/v1/auth/send-otp (POST) - missing phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({})
        .expect(400);
    });

    it('/api/v1/auth/send-otp (POST) - rate limit on 4th attempt', async () => {
      // We simulate 3 fast requests
      for (let i = 0; i < 3; i++) {
        await redisClient.incr(`otp_resends:${testPhone}`);
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone_number: testPhone });
        
      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many');
    });

    it('/api/v1/auth/verify-otp (POST) - invalid attempts lockout', async () => {
      // Simulate an OTP exists
      await redisClient.set(`otp:${testPhone}`, '123456');
      
      // Simulate 3 invalid attempts
      await redisClient.set(`otp_attempts:${testPhone}`, 3);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone_number: testPhone, otp: '999999' });

      expect(res.status).toBe(429);
      
      // Ensure OTP was deleted after lockout
      const otpStillExists = await redisClient.get(`otp:${testPhone}`);
      expect(otpStillExists).toBeNull();
    });

    it('/api/v1/auth/verify-otp (POST) - correct verification flow', async () => {
      // Set OTP manually to test verification
      await redisClient.set(`otp:${testPhone}`, '123456');
      await redisClient.set(`otp_attempts:${testPhone}`, 0);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone_number: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Ensure verification token was created
      const isVerified = await redisClient.get(`otp_verified:${testPhone}`);
      expect(isVerified).not.toBeNull();
    });
  });
});
