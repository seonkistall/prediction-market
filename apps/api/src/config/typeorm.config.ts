import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const isProduction = process.env.NODE_ENV === 'production';
const dbType = process.env.DB_TYPE || 'sqlite';

const getDataSourceOptions = (): DataSourceOptions => {
  if (dbType === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'prediction_market',
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
      migrationsRun: isProduction,
    };
  }

  // SQLite/SQL.js for development
  return {
    type: 'sqljs',
    location: process.env.DB_DATABASE || 'prediction_market.db',
    autoSave: true,
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: !isProduction,
    logging: !isProduction,
  };
};

export const dataSourceOptions = getDataSourceOptions();

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
