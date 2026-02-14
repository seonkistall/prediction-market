import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
import { PriceProvider, PriceData } from './interfaces/price-provider.interface';
import { BinanceProvider } from './providers/binance.provider';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { KISProvider } from './providers/kis.provider';

@Injectable()
export class PricesService implements OnModuleInit {
  private readonly logger = new Logger(PricesService.name);
  private providers: PriceProvider[] = [];
  private lastPrices = new Map<string, PriceData>();

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly binanceProvider: BinanceProvider,
    private readonly yahooProvider: YahooFinanceProvider,
    private readonly kisProvider: KISProvider,
  ) {}

  async onModuleInit() {
    // Initialize providers in priority order
    this.providers = [
      this.binanceProvider, // Primary for crypto
      this.yahooProvider, // Fallback for crypto, primary for US stocks
      this.kisProvider, // Primary for KOSPI
    ];

    // Check provider availability
    for (const provider of this.providers) {
      const available = await provider.isAvailable();
      this.logger.log(`Provider ${provider.name}: ${available ? 'available' : 'unavailable'}`);
    }
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    // Check Redis cache first
    const cacheKey = RedisService.keys.price(symbol);
    const cached = await this.redisService.get<PriceData>(cacheKey);

    if (cached) {
      return cached.price;
    }

    // Find a provider that supports this symbol
    const priceData = await this.fetchPrice(symbol);

    // Cache the result
    await this.redisService.set(cacheKey, priceData, RedisService.TTL_SHORT);

    // Store as last known price
    this.lastPrices.set(symbol.toUpperCase(), priceData);

    return priceData.price;
  }

  private async fetchPrice(symbol: string): Promise<PriceData> {
    const upperSymbol = symbol.toUpperCase();
    const errors: string[] = [];

    // Try each provider in order
    for (const provider of this.providers) {
      if (!provider.supports(upperSymbol)) {
        continue;
      }

      try {
        const priceData = await provider.getPrice(upperSymbol);
        this.logger.debug(`Got price for ${upperSymbol} from ${provider.name}: ${priceData.price}`);
        return priceData;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${provider.name}: ${errorMsg}`);
        this.logger.warn(`Provider ${provider.name} failed for ${upperSymbol}: ${errorMsg}`);
      }
    }

    // If all providers fail, try to return last known price
    const lastPrice = this.lastPrices.get(upperSymbol);
    if (lastPrice) {
      this.logger.warn(`All providers failed for ${upperSymbol}, using last known price`);
      return {
        ...lastPrice,
        timestamp: new Date(),
        source: `${lastPrice.source}-cached`,
      };
    }

    // Final fallback: mock price
    this.logger.warn(`No providers available for ${upperSymbol}, using mock price`);
    return this.getMockPrice(upperSymbol);
  }

  async getHistoricalPrices(
    symbol: string,
    from: Date,
    to: Date,
    interval?: '1m' | '5m' | '15m' | '1h' | '1d',
  ) {
    const upperSymbol = symbol.toUpperCase();

    for (const provider of this.providers) {
      if (!provider.supports(upperSymbol) || !provider.getHistoricalPrices) {
        continue;
      }

      try {
        return await provider.getHistoricalPrices(upperSymbol, from, to, interval);
      } catch (error) {
        this.logger.warn(`Historical prices failed from ${provider.name}: ${error}`);
      }
    }

    throw new Error(`No historical data available for ${symbol}`);
  }

  async getTWAP(symbol: string, periodMinutes: number): Promise<number> {
    // Try to get historical data for TWAP calculation
    const to = new Date();
    const from = new Date(to.getTime() - periodMinutes * 60 * 1000);

    try {
      const historicalData = await this.getHistoricalPrices(symbol, from, to, '1m');
      if (historicalData.prices.length > 0) {
        const sum = historicalData.prices.reduce((acc, p) => acc + p.close, 0);
        return sum / historicalData.prices.length;
      }
    } catch {
      // Fallback to current price
    }

    return this.getCurrentPrice(symbol);
  }

  private getMockPrice(symbol: string): PriceData {
    // Mock prices for various asset types
    const mockPrices: Record<string, number> = {
      // Crypto (USD)
      'BTC': 67500,
      'ETH': 3450,
      'BNB': 580,
      'SOL': 145,
      'XRP': 0.52,
      // KOSPI (KRW)
      '005930': 71500,
      'SAMSUNG': 71500,
      '000660': 128000,
      'SKHYNIX': 128000,
      // US Stocks (USD)
      'AAPL': 178.50,
      'GOOGL': 141.80,
      'MSFT': 405.20,
    };

    const basePrice = mockPrices[symbol] || 100;
    // Add small random variation (±0.2%)
    const variation = (Math.random() - 0.5) * 0.004 * basePrice;
    const price = symbol.match(/^\d{6}$/) || ['SAMSUNG', 'SKHYNIX', 'HYUNDAI', 'KIA', 'NAVER', 'KAKAO'].includes(symbol)
      ? Math.round(basePrice + variation) // Round for KRW
      : parseFloat((basePrice + variation).toFixed(2)); // 2 decimals for USD

    return {
      symbol,
      price,
      timestamp: new Date(),
      source: 'mock',
    };
  }

  // Helper method to determine asset category
  isCrypto(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '').replace('USDT', '');
    return cryptoSymbols.includes(upperSymbol);
  }

  isKOSPI(symbol: string): boolean {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '');
    // 6-digit stock codes or known KOSPI names
    return /^\d{6}$/.test(upperSymbol) ||
      ['SAMSUNG', 'SKHYNIX', 'LGENERGY', 'HYUNDAI', 'NAVER', 'KAKAO', 'KIA', 'LGCHEM'].includes(upperSymbol);
  }
}
