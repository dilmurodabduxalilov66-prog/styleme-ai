import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { AvailabilityController } from './availability.controller';
import { CrmController } from './crm.controller';
import { PortfolioController } from './portfolio.controller';
import { JwtStrategy } from '../../auth-service/src/jwt.strategy';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      path: '/metrics',
    }),
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
    HealthController,BookingController, AvailabilityController, CrmController, PortfolioController],
  providers: [
    BookingService, 
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class BookingModule {}
