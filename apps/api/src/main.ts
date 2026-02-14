import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SentryInterceptor } from './common/sentry/sentry.interceptor';
import { SentryService } from './common/sentry/sentry.service';
import { winstonConfig } from './common/logger/winston.config';
import { MetricsInterceptor } from './modules/metrics/metrics.interceptor';
import { MetricsService } from './modules/metrics/metrics.service';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig(isProduction)),
  });

  // Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : false, // Disable CSP in development for Swagger
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS Configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours
  });

  // Global prefix (exclude health and metrics endpoints for load balancers/Prometheus)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready', 'metrics'],
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Sentry Interceptor for error tracking
  const sentryService = app.get(SentryService);
  app.useGlobalInterceptors(new SentryInterceptor(sentryService));

  // Metrics Interceptor for Prometheus
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger (disable in production)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Prediction Market API')
      .setDescription('15min/Daily Binary Prediction Market API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!isProduction) {
    logger.log(`Swagger docs at http://localhost:${port}/docs`);
  }
}

bootstrap();
