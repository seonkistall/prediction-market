import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../entities/user.entity';

// Mock ethers with proper __esModule support
jest.mock('ethers', () => {
  const mockIsAddress = jest.fn();
  const mockVerifyMessage = jest.fn();
  return {
    __esModule: true,
    isAddress: mockIsAddress,
    verifyMessage: mockVerifyMessage,
    ethers: {
      isAddress: mockIsAddress,
      verifyMessage: mockVerifyMessage,
    },
  };
});

// Import the mocked module
import * as ethersModule from 'ethers';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  // Get references to the mock functions (cast via unknown to avoid TS error)
  const mockIsAddress = ethersModule.isAddress as unknown as jest.Mock;
  const mockVerifyMessage = ethersModule.verifyMessage as unknown as jest.Mock;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    nonce: 'test-nonce-12345678',
    role: UserRole.USER,
    balance: '1000',
    status: 'active',
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockIsAddress.mockReset();
    mockVerifyMessage.mockReset();

    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('getNonce', () => {
    it('should return a nonce for an existing user', async () => {
      mockIsAddress.mockReturnValue(true);
      userRepository.findOne.mockResolvedValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      const nonce = await service.getNonce(mockUser.walletAddress!);

      expect(nonce).toBeDefined();
      expect(nonce).toHaveLength(32); // 16 bytes hex = 32 chars
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { walletAddress: mockUser.walletAddress!.toLowerCase() },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should create a new user if not exists', async () => {
      mockIsAddress.mockReturnValue(true);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.count.mockResolvedValue(0);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      const nonce = await service.getNonce(mockUser.walletAddress!);

      expect(nonce).toBeDefined();
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid wallet address', async () => {
      mockIsAddress.mockReturnValue(false);

      await expect(service.getNonce('invalid-address')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifySignature', () => {
    const validDto = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      signature: '0xvalid-signature',
    };

    it('should return auth response for valid signature', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockVerifyMessage.mockReturnValue(validDto.walletAddress);
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await service.verifySignature(validDto);

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.walletAddress).toBe(mockUser.walletAddress);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.verifySignature(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockVerifyMessage.mockReturnValue('0xdifferent-address');

      await expect(service.verifySignature(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when signature verification fails', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockVerifyMessage.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.verifySignature(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.validateUser(mockUser.id!);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
