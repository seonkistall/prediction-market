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
import { User } from '../../entities/user.entity';
import { VerifySignatureDto, AuthResponseDto } from './dto';

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
      user = this.userRepository.create({
        walletAddress: normalizedAddress,
        nonce,
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

    const payload = { sub: user.id, wallet: user.walletAddress };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        balance: user.balance,
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
