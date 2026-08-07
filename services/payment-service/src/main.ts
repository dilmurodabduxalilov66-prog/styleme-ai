import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentModule } from './payment.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MonitoringInterceptor } from './monitoring.interceptor';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  const app = await NestFactory.create(PaymentModule, {
  logger: WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('PaymentService', { colors: true, prettyPrint: true }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json())
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json())
      }),
    ],
  }),
  });
  
  // Security Headers
  app.use(helmet());

  // CORS Whitelist
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://stylemeai.uz', 'https://www.stylemeai.uz'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global DTO validation pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Monitoring
  app.useGlobalInterceptors(new MonitoringInterceptor());
  
  const port = process.env.PORT || 9003;
  await app.listen(port, '0.0.0.0');
  console.log(`Payment Service is running on: http://0.0.0.0:${port}`);
}
bootstrap();
