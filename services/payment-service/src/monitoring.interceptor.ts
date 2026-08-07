import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Counter } from 'prom-client';
import * as Sentry from '@sentry/node';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private errorCounter: Counter<string>;

  constructor() {
    this.errorCounter = new Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'path', 'status'],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      catchError((error) => {
        const status = error.status || 500;
        
        // Prometheus
        this.errorCounter.inc({
          method: req.method,
          path: req.route ? req.route.path : req.url,
          status: status,
        });

        // Sentry
        if (status >= 500) {
          Sentry.captureException(error);
        }

        return throwError(() => error);
      }),
    );
  }
}
