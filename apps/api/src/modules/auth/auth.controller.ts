import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetNonceDto, VerifySignatureDto, AuthResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  @ApiOperation({ summary: 'Get nonce for wallet signature' })
  async getNonce(@Body() dto: GetNonceDto): Promise<{ nonce: string }> {
    const nonce = await this.authService.getNonce(dto.walletAddress);
    return { nonce };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify wallet signature and get JWT' })
  async verify(@Body() dto: VerifySignatureDto): Promise<AuthResponseDto> {
    return this.authService.verifySignature(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
