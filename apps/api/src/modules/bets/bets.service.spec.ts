import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BetsService } from './bets.service';
import { Bet, BetPosition, BetStatus } from '../../entities/bet.entity';
import { Round, RoundStatus } from '../../entities/round.entity';
import { User } from '../../entities/user.entity';
import { RoundsService } from '../markets/rounds.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BetsService', () => {
  let service: BetsService;
  let betRepository: jest.Mocked<Repository<Bet>>;
  let roundRepository: jest.Mocked<Repository<Round>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    balance: '1000',
    status: 'active',
  };

  const mockMarket = {
    id: 'market-uuid-123',
    symbol: 'BTC',
    minBet: '10',
    maxBet: '500',
    feeRate: '0.03',
  };

  const mockRound: Partial<Round> = {
    id: 'round-uuid-123',
    roundNumber: 1,
    marketId: mockMarket.id,
    market: mockMarket as any,
    status: RoundStatus.OPEN,
    totalUpPool: '100',
    totalDownPool: '100',
    upCount: 2,
    downCount: 2,
    bettingEndsAt: new Date(Date.now() + 60000),
  };

  const mockBet: Partial<Bet> = {
    id: 'bet-uuid-123',
    userId: mockUser.id,
    roundId: mockRound.id,
    position: BetPosition.UP,
    amount: '50',
    status: BetStatus.PENDING,
  };

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
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockBetRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBet], 1]),
      }),
      findOne: jest.fn(),
    };

    const mockRoundRepository = {
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockRoundsService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetsService,
        {
          provide: getRepositoryToken(Bet),
          useValue: mockBetRepository,
        },
        {
          provide: getRepositoryToken(Round),
          useValue: mockRoundRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: RoundsService,
          useValue: mockRoundsService,
        },
      ],
    }).compile();

    service = module.get<BetsService>(BetsService);
    betRepository = module.get(getRepositoryToken(Bet));
    roundRepository = module.get(getRepositoryToken(Round));
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBet', () => {
    const placeBetDto = {
      roundId: 'round-uuid-123',
      position: BetPosition.UP,
      amount: '50',
    };

    beforeEach(() => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser) // User lookup
        .mockResolvedValueOnce(mockRound) // Round lookup
        .mockResolvedValueOnce(null); // No existing bet
      mockQueryRunner.manager.save.mockResolvedValue(mockBet);
      mockQueryRunner.manager.create.mockReturnValue(mockBet);
    });

    it('should place a bet successfully', async () => {
      const result = await service.placeBet(mockUser.id!, placeBetDto);

      expect(result).toEqual(mockBet);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('bet.placed', expect.any(Object));
    });

    it('should throw NotFoundException if user not found', async () => {
      mockQueryRunner.manager.findOne.mockReset().mockResolvedValue(null);

      await expect(service.placeBet('non-existent', placeBetDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is suspended', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce({ ...mockUser, status: 'suspended' });

      await expect(service.placeBet(mockUser.id!, placeBetDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if round is not open', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockRound, status: RoundStatus.LOCKED });

      await expect(service.placeBet(mockUser.id!, placeBetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if betting period ended', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockRound, bettingEndsAt: new Date(Date.now() - 1000) });

      await expect(service.placeBet(mockUser.id!, placeBetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user already bet on round', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockRound)
        .mockResolvedValueOnce(mockBet); // Existing bet

      await expect(service.placeBet(mockUser.id!, placeBetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if amount below minBet', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockRound)
        .mockResolvedValueOnce(null);

      await expect(
        service.placeBet(mockUser.id!, { ...placeBetDto, amount: '5' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      mockQueryRunner.manager.findOne
        .mockReset()
        .mockResolvedValueOnce({ ...mockUser, balance: '10' })
        .mockResolvedValueOnce(mockRound)
        .mockResolvedValueOnce(null);

      await expect(
        service.placeBet(mockUser.id!, { ...placeBetDto, amount: '100' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserBets', () => {
    it('should return user bets with pagination', async () => {
      const result = await service.findUserBets(mockUser.id!, {
        limit: 10,
        offset: 0,
      });

      expect(result.bets).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBet], 1]),
      };
      betRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findUserBets(mockUser.id!, {
        status: BetStatus.WON,
        limit: 10,
        offset: 0,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('bet.status = :status', {
        status: BetStatus.WON,
      });
    });
  });

  describe('claimWinnings', () => {
    const wonBet = {
      ...mockBet,
      status: BetStatus.WON,
      payout: '100',
    };

    beforeEach(() => {
      mockQueryRunner.manager.findOne.mockResolvedValue(mockUser);
      mockQueryRunner.manager.find.mockResolvedValue([wonBet]);
      mockQueryRunner.manager.save.mockResolvedValue([{ ...wonBet, status: BetStatus.CLAIMED }]);
    });

    it('should claim winnings successfully', async () => {
      const result = await service.claimWinnings(mockUser.id!, [wonBet.id!]);

      expect(result.claimed).toBe(1);
      expect(result.totalPayout).toBe('100');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no winning bets', async () => {
      mockQueryRunner.manager.find.mockResolvedValue([]);

      await expect(service.claimWinnings(mockUser.id!, ['some-id'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
