import { DataSource } from 'typeorm';
import { Market, MarketType, AssetCategory } from '../entities/market.entity';

const markets = [
  // Crypto - 15min markets
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: AssetCategory.CRYPTO,
    marketType: MarketType.FIFTEEN_MIN,
    minBet: '0.001',
    maxBet: '10',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: AssetCategory.CRYPTO,
    marketType: MarketType.FIFTEEN_MIN,
    minBet: '0.001',
    maxBet: '10',
    feeRate: '0.03',
    isActive: true,
  },
  // Crypto - Daily markets
  {
    symbol: 'BTC-DAILY',
    name: 'Bitcoin Daily',
    category: AssetCategory.CRYPTO,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'ETH-DAILY',
    name: 'Ethereum Daily',
    category: AssetCategory.CRYPTO,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  // KOSPI Top 10 - Daily markets
  {
    symbol: 'SAMSUNG',
    name: '삼성전자',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'SKHYNIX',
    name: 'SK하이닉스',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'LGENERGY',
    name: 'LG에너지솔루션',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'SAMSUNGBIO',
    name: '삼성바이오로직스',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'HYUNDAI',
    name: '현대자동차',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'SAMSUNGSDI',
    name: '삼성SDI',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'NAVER',
    name: '네이버',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'KIA',
    name: '기아',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'LGCHEM',
    name: 'LG화학',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
  {
    symbol: 'KAKAO',
    name: '카카오',
    category: AssetCategory.KOSPI,
    marketType: MarketType.DAILY,
    minBet: '0.01',
    maxBet: '5',
    feeRate: '0.03',
    isActive: true,
  },
];

export async function seedMarkets(dataSource: DataSource): Promise<void> {
  const marketRepository = dataSource.getRepository(Market);

  for (const marketData of markets) {
    const existing = await marketRepository.findOne({
      where: { symbol: marketData.symbol },
    });

    if (!existing) {
      const market = marketRepository.create(marketData);
      await marketRepository.save(market);
      console.log(`✅ Created market: ${marketData.symbol} (${marketData.name})`);
    } else {
      console.log(`⏭️  Market already exists: ${marketData.symbol}`);
    }
  }

  console.log('\n🎉 Seed completed!');
}
