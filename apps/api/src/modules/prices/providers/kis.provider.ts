import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceProvider, PriceData } from '../interfaces/price-provider.interface';

interface KISTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KISPriceResponse {
  rt_cd: string; // 성공: '0', 실패: 그 외
  msg_cd: string;
  msg1: string;
  output: {
    stck_prpr: string; // 현재가
    prdy_vrss: string; // 전일 대비
    prdy_ctrt: string; // 전일 대비율
    stck_oprc: string; // 시가
    stck_hgpr: string; // 고가
    stck_lwpr: string; // 저가
    acml_vol: string; // 누적 거래량
  };
}

@Injectable()
export class KISProvider implements PriceProvider {
  readonly name = 'kis';
  private readonly logger = new Logger(KISProvider.name);

  private readonly appKey?: string;
  private readonly appSecret?: string;
  private readonly accountNo?: string;

  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  // Base URLs
  private readonly baseUrl = 'https://openapi.koreainvestment.com:9443';
  private readonly mockUrl = 'https://openapivts.koreainvestment.com:29443';

  // KOSPI stock code mappings
  private readonly stockCodes: Record<string, string> = {
    'SAMSUNG': '005930',
    'SKHYNIX': '000660',
    'LGENERGY': '373220',
    'SAMSUNGBIO': '207940',
    'HYUNDAI': '005380',
    'SAMSUNGSDI': '006400',
    'NAVER': '035420',
    'KIA': '000270',
    'LGCHEM': '051910',
    'KAKAO': '035720',
  };

  constructor(private readonly configService: ConfigService) {
    this.appKey = this.configService.get<string>('KIS_APP_KEY');
    this.appSecret = this.configService.get<string>('KIS_APP_SECRET');
    this.accountNo = this.configService.get<string>('KIS_ACCOUNT_NO');
  }

  supports(symbol: string): boolean {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '');

    // Support mapped names
    if (this.stockCodes[upperSymbol]) {
      return true;
    }

    // Support direct stock codes (6 digits for KOSPI)
    if (/^\d{6}$/.test(upperSymbol)) {
      return true;
    }

    return false;
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const stockCode = this.toStockCode(symbol);

    // If KIS credentials are not configured, return mock data
    if (!this.isConfigured()) {
      return this.getMockPrice(symbol, stockCode);
    }

    try {
      await this.ensureAccessToken();

      const url = `${this.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'authorization': `Bearer ${this.accessToken}`,
          'appkey': this.appKey!,
          'appsecret': this.appSecret!,
          'tr_id': 'FHKST01010100', // 주식현재가 시세
          'custtype': 'P', // 개인
        },
        // Query params
      });

      if (!response.ok) {
        throw new Error(`KIS API error: ${response.status}`);
      }

      const data: KISPriceResponse = await response.json();

      if (data.rt_cd !== '0') {
        throw new Error(`KIS API error: ${data.msg1}`);
      }

      return {
        symbol: symbol.toUpperCase(),
        price: parseInt(data.output.stck_prpr, 10),
        timestamp: new Date(),
        source: this.name,
      };
    } catch (error) {
      this.logger.warn(`KIS API failed for ${symbol}, using mock data`, error);
      return this.getMockPrice(symbol, stockCode);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.ensureAccessToken();
      return !!this.accessToken;
    } catch {
      return false;
    }
  }

  private isConfigured(): boolean {
    return !!(this.appKey && this.appSecret);
  }

  private async ensureAccessToken(): Promise<void> {
    // Check if token is still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiresAt) {
      const bufferTime = 5 * 60 * 1000;
      if (this.tokenExpiresAt.getTime() > Date.now() + bufferTime) {
        return;
      }
    }

    await this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<void> {
    const url = `${this.baseUrl}/oauth2/tokenP`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: this.appKey,
          appsecret: this.appSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data: KISTokenResponse = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

      this.logger.log('KIS access token refreshed');
    } catch (error) {
      this.logger.error('Failed to refresh KIS access token', error);
      throw error;
    }
  }

  private toStockCode(symbol: string): string {
    const upperSymbol = symbol.toUpperCase().replace('-DAILY', '');

    if (this.stockCodes[upperSymbol]) {
      return this.stockCodes[upperSymbol];
    }

    return upperSymbol;
  }

  private getMockPrice(symbol: string, stockCode: string): PriceData {
    // Mock prices for development (KRW)
    const mockPrices: Record<string, number> = {
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
    };

    const basePrice = mockPrices[stockCode] || 50000;
    // Add small random variation (±0.1%)
    const variation = (Math.random() - 0.5) * 0.002 * basePrice;
    const price = Math.round(basePrice + variation);

    this.logger.debug(`Using mock price for ${symbol}: ${price} KRW`);

    return {
      symbol: symbol.toUpperCase(),
      price,
      timestamp: new Date(),
      source: `${this.name}-mock`,
    };
  }
}
