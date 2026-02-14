import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import { User, UserRole } from '../../entities/user.entity';
import { VerifySignatureDto, AuthResponseDto } from './dto';

// Development: First user becomes admin
const DEV_ADMIN_ENABLED = process.env.NODE_ENV !== 'production';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async getNonce(walletAddress: string): Promise<string> {
    const normalizedAddress = walletAddress.toLowerCase();

    if (!ethers.isAddress(normalizedAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    let user = await this.userRepository.findOne({
      where: { walletAddress: normalizedAddress },
    });

    const nonce = randomBytes(16).toString('hex');

    if (user) {
      user.nonce = nonce;
      await this.userRepository.save(user);
    } else {
      // In development, first user becomes admin
      let role = UserRole.USER;
      if (DEV_ADMIN_ENABLED) {
        const userCount = await this.userRepository.count();
        if (userCount === 0) {
          role = UserRole.ADMIN;
        }
      }

      user = this.userRepository.create({
        walletAddress: normalizedAddress,
        nonce,
        role,
      });
      await this.userRepository.save(user);
    }

    return nonce;
  }

  async verifySignature(dto: VerifySignatureDto): Promise<AuthResponseDto> {
    const normalizedAddress = dto.walletAddress.toLowerCase();

    const user = await this.userRepository.findOne({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please request nonce first.');
    }

    const message = this.createSignMessage(user.nonce);

    try {
      const recoveredAddress = ethers.verifyMessage(message, dto.signature);

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid signature');
    }

    // Generate new nonce for next login
    user.nonce = randomBytes(16).toString('hex');
    await this.userRepository.save(user);

    const payload = { sub: user.id, wallet: user.walletAddress, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        balance: user.balance,
        role: user.role,
      },
    };
  }

  private createSignMessage(nonce: string): string {
    return `Welcome to Prediction Market!\n\nSign this message to authenticate.\n\nNonce: ${nonce}`;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
