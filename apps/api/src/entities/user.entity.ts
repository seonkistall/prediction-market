import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Bet } from './bet.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 42 })
  walletAddress: string;

  @Column({ length: 32 })
  nonce: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'suspended';

  @Column({ type: 'text', default: '0' })
  balance: string;

  @OneToMany(() => Bet, (bet) => bet.user)
  bets: Bet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
