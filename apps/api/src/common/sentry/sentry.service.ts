import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    if (!dsn) {
      this.logger.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    Sentry.init({
      dsn,
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (environment === 'development') {
          console.error('Sentry event (not sent in dev):', hint?.originalException);
          return null;
        }
        return event;
      },
    });

    this.isInitialized = true;
    this.logger.log(`Sentry initialized for ${environment} environment`);
  }

  captureException(exception: Error, context?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      this.logger.error('Exception (Sentry not initialized):', exception.message);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(exception);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.isInitialized) {
      this.logger.log(`Message (Sentry not initialized): ${message}`);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; walletAddress?: string }): void {
    if (!this.isInitialized) return;
    Sentry.setUser(user);
  }

  clearUser(): void {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.isInitialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized) return;
    Sentry.setContext(name, context);
  }
}
