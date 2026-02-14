import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Market } from './market.entity';
import { Bet } from './bet.entity';

export enum RoundStatus {
  PENDING = 'pending',
  OPEN = 'open',
  LOCKED = 'locked',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

export enum RoundOutcome {
  NONE = 'none',
  UP = 'up',
  DOWN = 'down',
}

@Entity('rounds')
@Index(['market', 'status'])
@Index(['status', 'bettingEndsAt'])
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  roundNumber: number;

  @ManyToOne(() => Market, (market) => market.rounds)
  market: Market;

  @Column({ type: 'varchar', length: 36 })
  marketId: string;

  @Column({ type: 'varchar', length: 20, default: RoundStatus.PENDING })
  status: RoundStatus;

  @Column({ type: 'text', nullable: true })
  startPrice: string | null;

  @Column({ type: 'text', nullable: true })
  lockPrice: string | null;

  @Column({ type: 'text', nullable: true })
  endPrice: string | null;

  @Column({ type: 'text', default: '0' })
  totalUpPool: string;

  @Column({ type: 'text', default: '0' })
  totalDownPool: string;

  @Column({ type: 'integer', default: 0 })
  upCount: number;

  @Column({ type: 'integer', default: 0 })
  downCount: number;

  @Column({ type: 'varchar', length: 20, default: RoundOutcome.NONE })
  outcome: RoundOutcome;

  @Column({ type: 'datetime' })
  startsAt: Date;

  @Column({ type: 'datetime' })
  bettingEndsAt: Date;

  @Column({ type: 'datetime' })
  settlesAt: Date;

  @Column({ type: 'datetime', nullable: true })
  settledAt: Date | null;

  @OneToMany(() => Bet, (bet) => bet.round)
  bets: Bet[];

  @CreateDateColumn()
  createdAt: Date;
}
