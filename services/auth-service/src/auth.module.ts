import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { EskizService } from './eskiz.service';
import { OtpService } from './otp.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      path: '/metrics',
    }),
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
      signOptions: { expiresIn: '7d' }, // Token expiration explicitly set
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        }
      ],
      storage: new ThrottlerStorageRedisService(process.env.REDIS_URL || 'redis://localhost:6379'),
    }),
  ],
  controllers: [
    HealthController,AuthController, AnalyticsController, AdminController],
  providers: [
    AuthService, 
    JwtStrategy,
    EskizService,
    OtpService,
    AnalyticsService,
    AdminService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
