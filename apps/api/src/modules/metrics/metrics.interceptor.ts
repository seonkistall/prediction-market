import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, path } = request;

    // Skip metrics endpoint itself
    if (path === '/metrics') {
      return next.handle();
    }

    this.metricsService.httpRequestsInProgress.inc({ method });
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          this.metricsService.recordHttpRequest(method, path, response.statusCode, duration);
          this.metricsService.httpRequestsInProgress.dec({ method });
        },
        error: () => {
          const duration = (Date.now() - startTime) / 1000;
          this.metricsService.recordHttpRequest(method, path, response.statusCode || 500, duration);
          this.metricsService.httpRequestsInProgress.dec({ method });
        },
      }),
    );
  }
}
