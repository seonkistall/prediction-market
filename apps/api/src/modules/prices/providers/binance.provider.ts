import { Injectable, Logger } from '@nestjs/common';
import { PriceProvider, PriceData, HistoricalPriceData } from '../interfaces/price-provider.interface';

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

interface BinanceKlineResponse {
  [index: number]: [
    number, // Open time
    string, // Open
    string, // High
    string, // Low
    string, // Close
    string, // Volume
    number, // Close time
    string, // Quote asset volume
    number, // Number of trades
    string, // Taker buy base asset volume
    string, // Taker buy quote asset volume
    string, // Ignore
  ];
}

@Injectable()
export class BinanceProvider implements PriceProvider {
  readonly name = 'binance';
  private readonly logger = new Logger(BinanceProvider.name);
  private readonly baseUrl = 'https://api.binance.com/api/v3';

  // Supported crypto symbols
  private readonly supportedSymbols = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC',
    'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'FIL', 'NEAR', 'APT', 'ARB', 'OP',
  ];

  supports(symbol: string): boolean {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '').replace('USDT', '');
    return this.supportedSymbols.includes(upperSymbol);
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const binanceSymbol = this.toBinanceSymbol(symbol);

    try {
      const response = await fetch(
        `${this.baseUrl}/ticker/price?symbol=${binanceSymbol}`,
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      const data: BinanceTickerResponse = await response.json();

      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(data.price),
        timestamp: new Date(),
        source: this.name,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${symbol}`, error);
      throw error;
    }
  }

  async getHistoricalPrices(
    symbol: string,
    from: Date,
    to: Date,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d',
  ): Promise<HistoricalPriceData> {
    const binanceSymbol = this.toBinanceSymbol(symbol);

    // Binance interval mapping
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '1d': '1d',
    };

    try {
      const url = `${this.baseUrl}/klines?symbol=${binanceSymbol}&interval=${intervalMap[interval]}&startTime=${from.getTime()}&endTime=${to.getTime()}&limit=1000`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data: BinanceKlineResponse[] = await response.json();

      const prices = (data as unknown as BinanceKlineResponse[]).map((kline: unknown) => {
        const k = kline as [number, string, string, string, string, string];
        return {
          timestamp: new Date(k[0]),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        };
      });

      return {
        symbol: symbol.toUpperCase(),
        prices,
        source: this.name,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch historical prices for ${symbol}`, error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private toBinanceSymbol(symbol: string): string {
    let baseSymbol = symbol.toUpperCase().replace('-DAILY', '');

    // If already has USDT suffix, return as is
    if (baseSymbol.endsWith('USDT')) {
      return baseSymbol;
    }

    // Append USDT
    return `${baseSymbol}USDT`;
  }
}
