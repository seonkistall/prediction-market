import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
  validateSync,
  MinLength,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum DatabaseType {
  SQLite = 'sqlite',
  Postgres = 'postgres',
}

export class EnvironmentVariables {
  // App
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  // Database
  @IsEnum(DatabaseType)
  @IsOptional()
  DB_TYPE: DatabaseType = DatabaseType.SQLite;

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT?: number;

  @IsString()
  @IsOptional()
  DB_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_DATABASE?: string;

  // JWT
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // CORS
  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // Blockchain
  @IsUrl({}, { message: 'RPC_URL must be a valid URL' })
  @IsOptional()
  RPC_URL?: string;

  @IsString()
  @IsOptional()
  PRIVATE_KEY?: string;

  // Sentry
  @IsUrl({}, { message: 'SENTRY_DSN must be a valid URL' })
  @IsOptional()
  SENTRY_DSN?: string;

  // Price APIs
  @IsString()
  @IsOptional()
  BINANCE_API_KEY?: string;

  @IsString()
  @IsOptional()
  BINANCE_API_SECRET?: string;

  @IsString()
  @IsOptional()
  YAHOO_FINANCE_API_KEY?: string;

  @IsString()
  @IsOptional()
  KIS_APP_KEY?: string;

  @IsString()
  @IsOptional()
  KIS_APP_SECRET?: string;

  @IsString()
  @IsOptional()
  KIS_ACCOUNT_NO?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Invalid value';
        return `${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
