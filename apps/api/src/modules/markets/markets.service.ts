import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Market, MarketType, AssetCategory } from '../../entities/market.entity';

interface FindAllOptions {
  category?: AssetCategory;
  type?: MarketType;
}

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
  ) {}

  async findAll(options: FindAllOptions = {}): Promise<Market[]> {
    const query = this.marketRepository
      .createQueryBuilder('market')
      .where('market.isActive = :isActive', { isActive: true });

    if (options.category) {
      query.andWhere('market.category = :category', { category: options.category });
    }

    if (options.type) {
      query.andWhere('market.marketType = :type', { type: options.type });
    }

    return query.orderBy('market.symbol', 'ASC').getMany();
  }

  async findBySymbol(symbol: string): Promise<Market> {
    const market = await this.marketRepository.findOne({
      where: { symbol: symbol.toUpperCase(), isActive: true },
    });

    if (!market) {
      throw new NotFoundException(`Market ${symbol} not found`);
    }

    return market;
  }

  async findById(id: string): Promise<Market> {
    const market = await this.marketRepository.findOne({
      where: { id },
    });

    if (!market) {
      throw new NotFoundException(`Market not found`);
    }

    return market;
  }
}
