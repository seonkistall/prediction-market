import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketsService } from './markets.service';
import { Market, MarketType, AssetCategory } from '../../entities/market.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('MarketsService', () => {
  let service: MarketsService;
  let marketRepository: jest.Mocked<Repository<Market>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockMarket: Partial<Market> = {
    id: 'market-uuid-123',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: AssetCategory.CRYPTO,
    marketType: MarketType.FIFTEEN_MIN,
    minBet: '10',
    maxBet: '1000',
    feeRate: '0.03',
    isActive: true,
  };

  beforeEach(async () => {
    const mockMarketRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMarket]),
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketsService,
        {
          provide: getRepositoryToken(Market),
          useValue: mockMarketRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<MarketsService>(MarketsService);
    marketRepository = module.get(getRepositoryToken(Market));
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return active markets', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockMarket]);
      expect(marketRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by category when provided', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMarket]),
      };
      marketRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAll({ category: AssetCategory.CRYPTO });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'market.category = :category',
        { category: AssetCategory.CRYPTO },
      );
    });
  });

  describe('findBySymbol', () => {
    it('should return market by symbol', async () => {
      marketRepository.findOne.mockResolvedValue(mockMarket as Market);

      const result = await service.findBySymbol('BTC');

      expect(result).toEqual(mockMarket);
      expect(marketRepository.findOne).toHaveBeenCalledWith({
        where: { symbol: 'BTC', isActive: true },
      });
    });

    it('should throw NotFoundException if market not found', async () => {
      marketRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySymbol('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      symbol: 'ETH',
      name: 'Ethereum',
      category: AssetCategory.CRYPTO,
      marketType: MarketType.FIFTEEN_MIN,
      minBet: '10',
      maxBet: '1000',
    };

    it('should create a new market', async () => {
      marketRepository.findOne.mockResolvedValue(null);
      marketRepository.create.mockReturnValue({ ...mockMarket, ...createDto } as Market);
      marketRepository.save.mockResolvedValue({ ...mockMarket, ...createDto, isActive: true } as Market);

      const result = await service.create(createDto);

      expect(result.symbol).toBe('ETH');
      expect(marketRepository.create).toHaveBeenCalled();
      expect(marketRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('market.created', expect.any(Object));
    });

    it('should throw ConflictException if symbol exists', async () => {
      marketRepository.findOne.mockResolvedValue(mockMarket as Market);

      await expect(service.create({ ...createDto, symbol: 'BTC' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if minBet >= maxBet', async () => {
      marketRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, minBet: '1000', maxBet: '100' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update market', async () => {
      marketRepository.findOne.mockResolvedValue(mockMarket as Market);
      marketRepository.save.mockResolvedValue({
        ...mockMarket,
        name: 'Updated Bitcoin',
      } as Market);

      const result = await service.update(mockMarket.id!, { name: 'Updated Bitcoin' });

      expect(result.name).toBe('Updated Bitcoin');
      expect(marketRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if market not found', async () => {
      marketRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle market active status', async () => {
      marketRepository.findOne.mockResolvedValue({ ...mockMarket, isActive: true } as Market);
      marketRepository.save.mockResolvedValue({ ...mockMarket, isActive: false } as Market);

      const result = await service.toggleActive(mockMarket.id!);

      expect(result.isActive).toBe(false);
    });

    it('should emit event when activating market', async () => {
      marketRepository.findOne.mockResolvedValue({ ...mockMarket, isActive: false } as Market);
      marketRepository.save.mockResolvedValue({ ...mockMarket, isActive: true } as Market);

      await service.toggleActive(mockMarket.id!);

      expect(eventEmitter.emit).toHaveBeenCalledWith('market.created', expect.any(Object));
    });
  });
});
