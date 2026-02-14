import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Market, MarketType, AssetCategory } from '../../entities/market.entity';
import { CreateMarketDto, UpdateMarketDto } from './dto';
import Decimal from 'decimal.js';

interface FindAllOptions {
  category?: AssetCategory;
  type?: MarketType;
}

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    private readonly eventEmitter: EventEmitter2,
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

  async findAllIncludingInactive(): Promise<Market[]> {
    return this.marketRepository.find({
      order: { symbol: 'ASC' },
    });
  }

  async create(dto: CreateMarketDto): Promise<Market> {
    // Check for duplicate symbol
    const existing = await this.marketRepository.findOne({
      where: { symbol: dto.symbol.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(
        `Market with symbol ${dto.symbol} already exists`,
      );
    }

    // Validate minBet < maxBet
    const minBet = new Decimal(dto.minBet);
    const maxBet = new Decimal(dto.maxBet);

    if (minBet.gte(maxBet)) {
      throw new BadRequestException('minBet must be less than maxBet');
    }

    const market = this.marketRepository.create({
      ...dto,
      symbol: dto.symbol.toUpperCase(),
      feeRate: dto.feeRate || '0.03',
    });

    const savedMarket = await this.marketRepository.save(market);

    this.logger.log(`Market ${savedMarket.symbol} created`);

    // Emit event for first round creation
    if (savedMarket.isActive) {
      this.eventEmitter.emit('market.created', {
        marketId: savedMarket.id,
        symbol: savedMarket.symbol,
      });
    }

    return savedMarket;
  }

  async update(id: string, dto: UpdateMarketDto): Promise<Market> {
    const market = await this.findById(id);

    // Validate bet limits if both provided
    if (dto.minBet && dto.maxBet) {
      const minBet = new Decimal(dto.minBet);
      const maxBet = new Decimal(dto.maxBet);

      if (minBet.gte(maxBet)) {
        throw new BadRequestException('minBet must be less than maxBet');
      }
    } else if (dto.minBet) {
      const minBet = new Decimal(dto.minBet);
      const maxBet = new Decimal(market.maxBet);

      if (minBet.gte(maxBet)) {
        throw new BadRequestException('minBet must be less than maxBet');
      }
    } else if (dto.maxBet) {
      const minBet = new Decimal(market.minBet);
      const maxBet = new Decimal(dto.maxBet);

      if (minBet.gte(maxBet)) {
        throw new BadRequestException('minBet must be less than maxBet');
      }
    }

    Object.assign(market, dto);
    const updatedMarket = await this.marketRepository.save(market);

    this.logger.log(`Market ${updatedMarket.symbol} updated`);

    return updatedMarket;
  }

  async toggleActive(id: string): Promise<Market> {
    const market = await this.findById(id);
    market.isActive = !market.isActive;

    const updatedMarket = await this.marketRepository.save(market);

    this.logger.log(
      `Market ${updatedMarket.symbol} ${updatedMarket.isActive ? 'activated' : 'deactivated'}`,
    );

    // If activated, emit event for round creation
    if (updatedMarket.isActive) {
      this.eventEmitter.emit('market.created', {
        marketId: updatedMarket.id,
        symbol: updatedMarket.symbol,
      });
    }

    return updatedMarket;
  }
}
