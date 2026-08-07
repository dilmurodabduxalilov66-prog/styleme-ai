import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      path: '/metrics',
    }),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60000,
        limit: 30, // 30 requests per minute
      }],
      storage: new ThrottlerStorageRedisService(process.env.REDIS_URL || 'redis://localhost:6379'),
    }),
  ],
  controllers: [
    HealthController,PaymentController],
  providers: [
    PaymentService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class PaymentModule {}
