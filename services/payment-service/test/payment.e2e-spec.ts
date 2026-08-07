import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentModule } from '../src/payment.module';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Override env variables for testing to ensure they are present
    process.env.CLICK_SECRET_KEY = 'test_click_secret';
    process.env.CLICK_MERCHANT_ID = 'test_click_merchant';
    process.env.CLICK_SERVICE_ID = '123';
    process.env.PAYME_SECRET_KEY = 'test_payme_secret';
    process.env.PAYME_MERCHANT_ID = 'test_payme_merchant';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Checkout', () => {
    it('/api/v1/payments/checkout (POST) - should generate click url', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .send({ booking_id: 'test_booking_1', amount: 50000, provider: 'CLICK' })
        .expect(200)
        .expect((res) => {
          expect(res.body.url).toBeDefined();
          expect(res.body.url).toContain('my.click.uz');
        });
    });

    it('/api/v1/payments/checkout (POST) - should fail for unknown provider', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .send({ booking_id: 'test_booking_1', amount: 50000, provider: 'UNKNOWN' })
        .expect(400);
    });
  });

  describe('Webhooks', () => {
    it('/api/v1/payments/webhooks/click (POST) - should reject invalid signature', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/webhooks/click')
        .send({
          click_trans_id: 123,
          service_id: 1,
          click_paydoc_id: 1,
          merchant_trans_id: 'test_booking_1',
          amount: 50000,
          action: 1,
          error: 0,
          sign_time: '2026-01-01',
          sign_string: 'invalid'
        })
        .expect(401);
    });

    it('/api/v1/payments/webhooks/payme (POST) - should reject invalid auth header', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/webhooks/payme')
        .set('Authorization', 'Basic invalid_base64')
        .send({
          method: 'CheckPerformTransaction',
          params: {},
          id: 1
        })
        .expect(401);
    });
  });
});
