import { DataSource } from 'typeorm';
import { Market, MarketType, AssetCategory } from '../entities/market.entity';
import { User, UserRole } from '../entities/user.entity';

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

  console.log('\n🎉 Market seed completed!');
}

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Test admin wallet address (for development only)
  const adminWallet = '0x0000000000000000000000000000000000000001';

  const existing = await userRepository.findOne({
    where: { walletAddress: adminWallet },
  });

  if (!existing) {
    const admin = userRepository.create({
      walletAddress: adminWallet,
      nonce: 'admin-test-nonce',
      role: UserRole.ADMIN,
      balance: '100',
    });
    await userRepository.save(admin);
    console.log(`✅ Created admin user: ${adminWallet}`);
  } else if (existing.role !== UserRole.ADMIN) {
    existing.role = UserRole.ADMIN;
    await userRepository.save(existing);
    console.log(`✅ Updated user to admin: ${adminWallet}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminWallet}`);
  }

  console.log('\n🎉 Admin seed completed!');
}
