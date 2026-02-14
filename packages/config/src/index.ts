// Network Configuration
export const SUPPORTED_CHAINS = {
  mainnet: 1,
  sepolia: 11155111,
  localhost: 31337,
} as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

// Contract Addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES: Record<SupportedChainId, {
  predictionMarket: string;
  vault: string;
}> = {
  [SUPPORTED_CHAINS.mainnet]: {
    predictionMarket: '0x0000000000000000000000000000000000000000',
    vault: '0x0000000000000000000000000000000000000000',
  },
  [SUPPORTED_CHAINS.sepolia]: {
    predictionMarket: '0x0000000000000000000000000000000000000000',
    vault: '0x0000000000000000000000000000000000000000',
  },
  [SUPPORTED_CHAINS.localhost]: {
    predictionMarket: '0x0000000000000000000000000000000000000000',
    vault: '0x0000000000000000000000000000000000000000',
  },
};

// Market Configuration
export const MARKET_CONFIG = {
  // 15min market
  '15min': {
    roundDurationSeconds: 15 * 60, // 15 minutes
    bettingDurationSeconds: 12 * 60, // 12 minutes betting window
    lockDurationSeconds: 3 * 60, // 3 minutes lock period
  },
  // Daily market
  daily: {
    roundDurationSeconds: 24 * 60 * 60, // 24 hours
    bettingDurationSeconds: 23 * 60 * 60, // 23 hours betting window
    lockDurationSeconds: 60 * 60, // 1 hour lock period
  },
} as const;

// Fee Configuration
export const FEE_CONFIG = {
  defaultFeeRate: 0.03, // 3%
  maxFeeRate: 0.1, // 10% max
  minFeeRate: 0.01, // 1% min
} as const;

// Betting Limits
export const BETTING_LIMITS = {
  crypto: {
    minBet: '0.001', // 0.001 ETH
    maxBet: '10', // 10 ETH
  },
  kospi: {
    minBet: '0.01', // 0.01 ETH
    maxBet: '5', // 5 ETH
  },
} as const;

// Supported Assets
export const SUPPORTED_ASSETS = {
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', pair: 'BTCUSDT' },
    { symbol: 'ETH', name: 'Ethereum', pair: 'ETHUSDT' },
  ],
  kospi: [
    { symbol: '005930', name: 'Samsung Electronics' },
    { symbol: '000660', name: 'SK Hynix' },
    { symbol: '373220', name: 'LG Energy Solution' },
    { symbol: '207940', name: 'Samsung Biologics' },
    { symbol: '005380', name: 'Hyundai Motor' },
    { symbol: '006400', name: 'Samsung SDI' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '000270', name: 'Kia' },
    { symbol: '051910', name: 'LG Chem' },
    { symbol: '035720', name: 'Kakao' },
  ],
} as const;

// Price Sources
export const PRICE_SOURCES = {
  binance: {
    restUrl: 'https://api.binance.com/api/v3',
    wsUrl: 'wss://stream.binance.com:9443/ws',
  },
  kis: {
    // Korea Investment & Securities
    restUrl: 'https://openapi.koreainvestment.com:9443',
  },
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  apiPrefix: '/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  timeout: 10000,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  api: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  betting: {
    windowMs: 60000,
    maxRequests: 20,
  },
} as const;
