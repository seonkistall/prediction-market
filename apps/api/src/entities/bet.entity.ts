import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Round } from './round.entity';

export enum BetPosition {
  UP = 'up',
  DOWN = 'down',
}

export enum BetStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
  CLAIMED = 'claimed',
}

@Entity('bets')
@Index(['user', 'createdAt'])
@Index(['round', 'position'])
@Unique(['user', 'round'])
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bets)
  user: User;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => Round, (round) => round.bets)
  round: Round;

  @Column({ type: 'varchar', length: 36 })
  roundId: string;

  @Column({ type: 'varchar', length: 20 })
  position: BetPosition;

  @Column({ type: 'text' })
  amount: string;

  @Column({ type: 'varchar', length: 20, default: BetStatus.PENDING })
  status: BetStatus;

  @Column({ type: 'text', nullable: true })
  payout: string | null;

  @Column({ type: 'text', nullable: true })
  payoutMultiplier: string | null;

  @Column({ type: 'datetime', nullable: true })
  claimedAt: Date | null;

  @Column({ type: 'varchar', length: 66, nullable: true })
  txHash: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
