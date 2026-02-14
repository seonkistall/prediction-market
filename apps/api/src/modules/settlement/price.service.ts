import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private priceCache = new Map<string, PriceData>();

  constructor(private readonly configService: ConfigService) {}

  async getCurrentPrice(symbol: string): Promise<number> {
    // Check cache first (valid for 5 seconds)
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp.getTime() < 5000) {
      return cached.price;
    }

    try {
      const price = await this.fetchPrice(symbol);
      this.priceCache.set(symbol, {
        symbol,
        price,
        timestamp: new Date(),
      });
      return price;
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${symbol}`, error);
      // Return cached price if available
      if (cached) {
        return cached.price;
      }
      throw error;
    }
  }

  private async fetchPrice(symbol: string): Promise<number> {
    // Determine if crypto or stock
    if (this.isCrypto(symbol)) {
      return this.fetchCryptoPrice(symbol);
    } else {
      return this.fetchStockPrice(symbol);
    }
  }

  private isCrypto(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BTCUSDT', 'ETHUSDT'];
    return cryptoSymbols.some((s) => symbol.toUpperCase().includes(s));
  }

  private async fetchCryptoPrice(symbol: string): Promise<number> {
    // Remove -DAILY suffix if present
    let baseSymbol = symbol.replace('-DAILY', '').toUpperCase();
    const binanceSymbol = baseSymbol.includes('USDT') ? baseSymbol : `${baseSymbol}USDT`;

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  }

  private async fetchStockPrice(symbol: string): Promise<number> {
    // For KOSPI stocks, use KIS API
    const kisAppKey = this.configService.get('KIS_APP_KEY');
    const kisAppSecret = this.configService.get('KIS_APP_SECRET');

    if (!kisAppKey || !kisAppSecret) {
      this.logger.warn('KIS API credentials not configured, using mock price');
      return this.getMockStockPrice(symbol);
    }

    // TODO: Implement actual KIS API integration
    // For now, return mock price
    return this.getMockStockPrice(symbol);
  }

  private getMockStockPrice(symbol: string): number {
    // Mock prices for development (KRW)
    const mockPrices: Record<string, number> = {
      // By stock code
      '005930': 71500, // Samsung Electronics
      '000660': 128000, // SK Hynix
      '373220': 235000, // LG Energy Solution
      '207940': 578000, // Samsung Biologics
      '005380': 183500, // Hyundai Motor
      '006400': 74300, // Samsung SDI
      '035420': 175000, // NAVER
      '000270': 54900, // Kia
      '051910': 335000, // LG Chem
      '035720': 49850, // Kakao
      // By symbol name
      'SAMSUNG': 71500,
      'SKHYNIX': 128000,
      'LGENERGY': 235000,
      'SAMSUNGBIO': 578000,
      'HYUNDAI': 183500,
      'SAMSUNGSDI': 74300,
      'NAVER': 175000,
      'KIA': 54900,
      'LGCHEM': 335000,
      'KAKAO': 49850,
    };

    const price = mockPrices[symbol.toUpperCase()] || 50000;
    // Add small random variation
    const variation = (Math.random() - 0.5) * 0.002 * price;
    return Math.round(price + variation);
  }

  async getTWAP(symbol: string, periodMinutes: number): Promise<number> {
    // Simplified TWAP calculation
    // In production, this would aggregate historical prices
    const prices: number[] = [];
    const intervals = Math.min(periodMinutes, 15);

    for (let i = 0; i < intervals; i++) {
      prices.push(await this.getCurrentPrice(symbol));
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }
}
