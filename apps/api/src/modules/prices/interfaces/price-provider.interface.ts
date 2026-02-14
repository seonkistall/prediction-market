export interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  source: string;
}

export interface HistoricalPriceData {
  symbol: string;
  prices: Array<{
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  source: string;
}

export interface PriceProvider {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Check if this provider supports the given symbol
   */
  supports(symbol: string): boolean;

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): Promise<PriceData>;

  /**
   * Get historical prices for a symbol (optional)
   */
  getHistoricalPrices?(
    symbol: string,
    from: Date,
    to: Date,
    interval?: '1m' | '5m' | '15m' | '1h' | '1d',
  ): Promise<HistoricalPriceData>;

  /**
   * Check if provider is currently available
   */
  isAvailable(): Promise<boolean>;
}

export const PRICE_PROVIDER = 'PRICE_PROVIDER';
