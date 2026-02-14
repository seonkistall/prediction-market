import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Round } from './round.entity';

export enum MarketType {
  FIFTEEN_MIN = '15min',
  DAILY = 'daily',
}

export enum AssetCategory {
  CRYPTO = 'crypto',
  KOSPI = 'kospi',
}

@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  symbol: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  category: AssetCategory;

  @Column({ type: 'varchar', length: 20 })
  marketType: MarketType;

  @Column({ type: 'text' })
  minBet: string;

  @Column({ type: 'text' })
  maxBet: string;

  @Column({ type: 'text', default: '0.03' })
  feeRate: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Round, (round) => round.market)
  rounds: Round[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
