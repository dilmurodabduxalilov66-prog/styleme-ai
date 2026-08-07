import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { JwtStrategy } from '../../auth-service/src/jwt.strategy';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
    TerminusModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [
    HealthController,ReputationController],
  providers: [ReputationService, JwtStrategy],
  exports: [ReputationService],
})
export class ReputationModule {}
