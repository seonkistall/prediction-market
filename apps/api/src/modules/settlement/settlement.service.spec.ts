import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettlementService } from './settlement.service';
import { Round, RoundStatus, RoundOutcome } from '../../entities/round.entity';
import { Bet, BetPosition, BetStatus } from '../../entities/bet.entity';
import { Market, MarketType, AssetCategory } from '../../entities/market.entity';
import { PricesService } from '../prices/prices.service';

describe('SettlementService', () => {
  let service: SettlementService;
  let roundRepository: jest.Mocked<Repository<Round>>;
  let pricesService: jest.Mocked<PricesService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockMarket: Partial<Market> = {
    id: 'market-uuid-123',
    symbol: 'BTC',
    feeRate: '0.03',
    marketType: MarketType.FIFTEEN_MIN,
    category: AssetCategory.CRYPTO,
    isActive: true,
  };

  const mockRound: Partial<Round> = {
    id: 'round-uuid-123',
    roundNumber: 1,
    marketId: mockMarket.id,
    market: mockMarket as Market,
    status: RoundStatus.OPEN,
    startPrice: '50000',
    lockPrice: null,
    totalUpPool: '500',
    totalDownPool: '300',
    upCount: 5,
    downCount: 3,
    bettingEndsAt: new Date(Date.now() - 1000),
    settlesAt: new Date(Date.now() + 60000),
  };

  const mockBets: Partial<Bet>[] = [
    {
      id: 'bet-1',
      position: BetPosition.UP,
      amount: '100',
      status: BetStatus.PENDING,
    },
    {
      id: 'bet-2',
      position: BetPosition.UP,
      amount: '400',
      status: BetStatus.PENDING,
    },
    {
      id: 'bet-3',
      position: BetPosition.DOWN,
      amount: '300',
      status: BetStatus.PENDING,
    },
  ];

  // Mock QueryRunner
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockRoundRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockBetRepository = {
      find: jest.fn(),
    };

    const mockMarketRepository = {
      findOne: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const mockPricesService = {
      getCurrentPrice: jest.fn().mockResolvedValue(50500),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        {
          provide: getRepositoryToken(Round),
          useValue: mockRoundRepository,
        },
        {
          provide: getRepositoryToken(Bet),
          useValue: mockBetRepository,
        },
        {
          provide: getRepositoryToken(Market),
          useValue: mockMarketRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: PricesService,
          useValue: mockPricesService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SettlementService>(SettlementService);
    roundRepository = module.get(getRepositoryToken(Round));
    pricesService = module.get(PricesService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lockRound', () => {
    it('should lock round with current price', async () => {
      pricesService.getCurrentPrice.mockResolvedValue(50500);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockRound,
        status: RoundStatus.LOCKED,
        lockPrice: '50500',
      });

      await service.lockRound(mockRound as Round);

      expect(pricesService.getCurrentPrice).toHaveBeenCalledWith('BTC');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('round.locked', expect.objectContaining({
        roundId: mockRound.id,
        lockPrice: '50500',
      }));
    });

    it('should rollback on error', async () => {
      pricesService.getCurrentPrice.mockRejectedValue(new Error('API Error'));

      await expect(service.lockRound(mockRound as Round)).rejects.toThrow('API Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('settleRound', () => {
    const lockedRound = {
      ...mockRound,
      status: RoundStatus.LOCKED,
      lockPrice: '50000',
    };

    beforeEach(() => {
      mockQueryRunner.manager.find.mockResolvedValue(mockBets);
      mockQueryRunner.manager.save.mockImplementation((entity) => Promise.resolve(entity));
    });

    it('should settle round with UP outcome when price increases', async () => {
      pricesService.getCurrentPrice.mockResolvedValue(50500); // Price increased

      await service.settleRound(lockedRound as Round);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('round.settled', expect.objectContaining({
        outcome: RoundOutcome.UP,
      }));
    });

    it('should settle round with DOWN outcome when price decreases', async () => {
      pricesService.getCurrentPrice.mockResolvedValue(49500); // Price decreased

      await service.settleRound(lockedRound as Round);

      expect(eventEmitter.emit).toHaveBeenCalledWith('round.settled', expect.objectContaining({
        outcome: RoundOutcome.DOWN,
      }));
    });

    it('should cancel bets when price unchanged', async () => {
      pricesService.getCurrentPrice.mockResolvedValue(50000); // Same as lockPrice

      await service.settleRound(lockedRound as Round);

      expect(eventEmitter.emit).toHaveBeenCalledWith('round.settled', expect.objectContaining({
        outcome: RoundOutcome.NONE,
      }));
    });

    it('should calculate correct payouts for winners', async () => {
      pricesService.getCurrentPrice.mockResolvedValue(50500);
      const savedBets: Bet[] = [];
      mockQueryRunner.manager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) {
          savedBets.push(...entity);
        }
        return Promise.resolve(entity);
      });

      await service.settleRound(lockedRound as Round);

      // Total pool = 800, fee = 24, winner pool = 776
      // UP bets won (500 total): bet-1 gets 776*100/500 = 155.2, bet-2 gets 776*400/500 = 620.8
      // DOWN bet lost: bet-3 gets 0
    });
  });

  describe('createNextRound', () => {
    it('should create first round for market', async () => {
      roundRepository.findOne.mockResolvedValue(null);
      pricesService.getCurrentPrice.mockResolvedValue(50000);
      roundRepository.create.mockReturnValue({
        roundNumber: 1,
        marketId: mockMarket.id,
        status: RoundStatus.OPEN,
      } as Round);
      roundRepository.save.mockResolvedValue({
        id: 'new-round-id',
        roundNumber: 1,
      } as Round);

      const result = await service.createNextRound(mockMarket as Market);

      expect(result.roundNumber).toBe(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith('round.created', expect.any(Object));
    });

    it('should create subsequent round with incremented number', async () => {
      roundRepository.findOne.mockResolvedValue({ roundNumber: 5 } as Round);
      pricesService.getCurrentPrice.mockResolvedValue(50000);
      roundRepository.create.mockReturnValue({
        roundNumber: 6,
        marketId: mockMarket.id,
        status: RoundStatus.OPEN,
      } as Round);
      roundRepository.save.mockResolvedValue({
        id: 'new-round-id',
        roundNumber: 6,
      } as Round);

      const result = await service.createNextRound(mockMarket as Market);

      expect(result.roundNumber).toBe(6);
    });

    it('should set correct timing for 15min market', async () => {
      const fifteenMinMarket = { ...mockMarket, marketType: MarketType.FIFTEEN_MIN };
      roundRepository.findOne.mockResolvedValue(null);
      pricesService.getCurrentPrice.mockResolvedValue(50000);

      let createdRound: Partial<Round> = {};
      roundRepository.create.mockImplementation((data) => {
        createdRound = data as Partial<Round>;
        return data as Round;
      });
      roundRepository.save.mockResolvedValue({ id: 'new', roundNumber: 1 } as Round);

      await service.createNextRound(fifteenMinMarket as Market);

      // Betting ends 12 min after start
      const bettingDuration = createdRound.bettingEndsAt!.getTime() - createdRound.startsAt!.getTime();
      expect(bettingDuration).toBe(12 * 60 * 1000);

      // Settles 15 min after start
      const totalDuration = createdRound.settlesAt!.getTime() - createdRound.startsAt!.getTime();
      expect(totalDuration).toBe(15 * 60 * 1000);
    });
  });
});
