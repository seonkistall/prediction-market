// Market Types
export enum MarketType {
  FIFTEEN_MIN = '15min',
  DAILY = 'daily',
}

export enum AssetCategory {
  CRYPTO = 'crypto',
  KOSPI = 'kospi',
}

export interface Market {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  marketType: MarketType;
  minBet: string;
  maxBet: string;
  feeRate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Round Types
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

export interface Round {
  id: string;
  roundNumber: number;
  marketId: string;
  status: RoundStatus;
  startPrice: string | null;
  lockPrice: string | null;
  endPrice: string | null;
  totalUpPool: string;
  totalDownPool: string;
  upCount: number;
  downCount: number;
  outcome: RoundOutcome;
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
  settledAt: string | null;
  createdAt: string;
}

// Bet Types
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

export interface Bet {
  id: string;
  userId: string;
  roundId: string;
  position: BetPosition;
  amount: string;
  status: BetStatus;
  payout: string | null;
  payoutMultiplier: string | null;
  claimedAt: string | null;
  txHash: string | null;
  createdAt: string;
}

// User Types
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  walletAddress: string;
  status: UserStatus;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BettingStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  pending: number;
  winRate: string;
  totalWagered: string;
  totalWon: string;
  totalLost: string;
  netProfit: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    walletAddress: string;
    balance: string;
  };
}

// Price Types
export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
  source: string;
}

// Event Types (for WebSocket)
export interface RoundCreatedEvent {
  roundId: string;
  marketSymbol: string;
  roundNumber: number;
  startsAt: string;
  bettingEndsAt: string;
  settlesAt: string;
}

export interface RoundLockedEvent {
  roundId: string;
  marketSymbol: string;
  lockPrice: string;
}

export interface RoundSettledEvent {
  roundId: string;
  marketSymbol: string;
  outcome: RoundOutcome;
  endPrice: string;
  lockPrice: string;
}

export interface BetPlacedEvent {
  bet: Bet;
  round: {
    id: string;
    totalUpPool: string;
    totalDownPool: string;
    upCount: number;
    downCount: number;
  };
}
