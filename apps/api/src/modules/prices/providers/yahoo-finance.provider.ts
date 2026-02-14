import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceProvider, PriceData, HistoricalPriceData } from '../interfaces/price-provider.interface';

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice: number;
      regularMarketTime: number;
    }>;
    error: string | null;
  };
}

@Injectable()
export class YahooFinanceProvider implements PriceProvider {
  readonly name = 'yahoo-finance';
  private readonly logger = new Logger(YahooFinanceProvider.name);
  private readonly apiKey?: string;
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v7/finance';

  // Symbol mappings for crypto and US stocks
  private readonly symbolMappings: Record<string, string> = {
    // Crypto
    'BTC': 'BTC-USD',
    'ETH': 'ETH-USD',
    'BNB': 'BNB-USD',
    'SOL': 'SOL-USD',
    'XRP': 'XRP-USD',
    'ADA': 'ADA-USD',
    'DOGE': 'DOGE-USD',
    // US Stocks
    'AAPL': 'AAPL',
    'GOOGL': 'GOOGL',
    'MSFT': 'MSFT',
    'AMZN': 'AMZN',
    'META': 'META',
    'TSLA': 'TSLA',
    'NVDA': 'NVDA',
  };

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YAHOO_FINANCE_API_KEY');
  }

  supports(symbol: string): boolean {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '');

    // Check if it's a mapped symbol
    if (this.symbolMappings[upperSymbol]) {
      return true;
    }

    // Check if it's a crypto symbol
    if (this.isCryptoSymbol(upperSymbol)) {
      return true;
    }

    // Check if it's a US stock symbol (letters only, 1-5 chars)
    if (/^[A-Z]{1,5}$/.test(upperSymbol)) {
      return true;
    }

    return false;
  }

  private isCryptoSymbol(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];
    return cryptoSymbols.includes(symbol);
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const yahooSymbol = this.toYahooSymbol(symbol);

    try {
      const url = `${this.baseUrl}/quote?symbols=${yahooSymbol}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
      }

      const data: YahooQuoteResponse = await response.json();

      if (data.quoteResponse.error) {
        throw new Error(`Yahoo Finance error: ${data.quoteResponse.error}`);
      }

      const quote = data.quoteResponse.result[0];
      if (!quote) {
        throw new Error(`No quote data for symbol: ${symbol}`);
      }

      return {
        symbol: symbol.toUpperCase(),
        price: quote.regularMarketPrice,
        timestamp: new Date(quote.regularMarketTime * 1000),
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
    const yahooSymbol = this.toYahooSymbol(symbol);

    // Yahoo Finance interval mapping
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '1d': '1d',
    };

    try {
      const url = `${this.baseUrl}/chart/${yahooSymbol}?period1=${Math.floor(from.getTime() / 1000)}&period2=${Math.floor(to.getTime() / 1000)}&interval=${intervalMap[interval]}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        throw new Error(`No historical data for symbol: ${symbol}`);
      }

      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};

      const prices = timestamps.map((ts: number, i: number) => ({
        timestamp: new Date(ts * 1000),
        open: quotes.open?.[i] || 0,
        high: quotes.high?.[i] || 0,
        low: quotes.low?.[i] || 0,
        close: quotes.close?.[i] || 0,
        volume: quotes.volume?.[i],
      }));

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
      const response = await fetch(`${this.baseUrl}/quote?symbols=AAPL`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private toYahooSymbol(symbol: string): string {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '');

    if (this.symbolMappings[upperSymbol]) {
      return this.symbolMappings[upperSymbol];
    }

    // If crypto without mapping, append -USD
    if (this.isCryptoSymbol(upperSymbol)) {
      return `${upperSymbol}-USD`;
    }

    return upperSymbol;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PredictionMarket/1.0)',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    return headers;
  }
}
