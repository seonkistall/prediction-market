import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SentryService } from './sentry.service';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Add breadcrumb for the request
    this.sentryService.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level: 'info',
      data: {
        method,
        url,
        hasBody: !!body,
      },
    });

    // Set user context if available
    if (user?.id) {
      this.sentryService.setUser({
        id: user.id,
        walletAddress: user.walletAddress,
      });
    }

    return next.handle().pipe(
      catchError((error) => {
        // Don't report 4xx errors to Sentry (client errors)
        if (error instanceof HttpException && error.getStatus() < 500) {
          return throwError(() => error);
        }

        // Capture 5xx errors and unexpected errors
        this.sentryService.captureException(error, {
          method,
          url,
          userId: user?.id,
          walletAddress: user?.walletAddress,
        });

        return throwError(() => error);
      }),
    );
  }
}
