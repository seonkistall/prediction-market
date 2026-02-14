import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress } from 'class-validator';

export class GetNonceDto {
  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  @IsEthereumAddress()
  walletAddress: string;
}

export class VerifySignatureDto {
  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({ example: '0x...' })
  @IsString()
  signature: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    walletAddress: string;
    balance: string;
  };
}
