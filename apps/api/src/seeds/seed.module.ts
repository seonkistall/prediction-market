import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Market } from '../entities/market.entity';
import { User } from '../entities/user.entity';
import { seedMarkets, seedAdminUser } from './seed';

@Module({
  imports: [TypeOrmModule.forFeature([Market, User])],
})
export class SeedModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    console.log('\n🌱 Running database seed...\n');
    await seedMarkets(this.dataSource);
    await seedAdminUser(this.dataSource);
  }
}
