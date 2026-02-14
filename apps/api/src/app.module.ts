import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { MarketsModule } from './modules/markets/markets.module';
import { BetsModule } from './modules/bets/bets.module';
import { UsersModule } from './modules/users/users.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { SeedModule } from './seeds/seed.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DB_TYPE', 'sqlite');

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get('DB_HOST', 'localhost'),
            port: config.get('DB_PORT', 5432),
            username: config.get('DB_USERNAME', 'postgres'),
            password: config.get('DB_PASSWORD', 'postgres'),
            database: config.get('DB_DATABASE', 'prediction_market'),
            autoLoadEntities: true,
            synchronize: config.get('NODE_ENV') !== 'production',
            logging: config.get('NODE_ENV') === 'development',
          };
        }

        // SQLite for local development (using sql.js - pure JS)
        return {
          type: 'sqljs',
          location: config.get('DB_DATABASE', 'prediction_market.db'),
          autoSave: true,
          autoLoadEntities: true,
          synchronize: true,
          logging: config.get('NODE_ENV') === 'development',
        };
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Event emitter for real-time updates
    EventEmitterModule.forRoot(),

    // Scheduling for round management
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    MarketsModule,
    BetsModule,
    UsersModule,
    SettlementModule,

    // Seed module (runs on startup)
    SeedModule,
  ],
})
export class AppModule {}
