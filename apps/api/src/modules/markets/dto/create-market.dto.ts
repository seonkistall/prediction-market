import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { MarketType, AssetCategory } from '../../../entities/market.entity';

export class CreateMarketDto {
  @ApiProperty({ example: 'SOL', description: 'Market symbol (unique)' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  symbol: string;

  @ApiProperty({ example: 'Solana' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AssetCategory, example: AssetCategory.CRYPTO })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({ enum: MarketType, example: MarketType.FIFTEEN_MIN })
  @IsEnum(MarketType)
  marketType: MarketType;

  @ApiProperty({ example: '0.001', description: 'Minimum bet amount in ETH' })
  @IsString()
  @Matches(/^\d+\.?\d*$/, { message: 'minBet must be a valid decimal number' })
  minBet: string;

  @ApiProperty({ example: '1', description: 'Maximum bet amount in ETH' })
  @IsString()
  @Matches(/^\d+\.?\d*$/, { message: 'maxBet must be a valid decimal number' })
  maxBet: string;

  @ApiProperty({
    example: '0.03',
    description: 'Fee rate (0.03 = 3%)',
    required: false,
  })
  @IsString()
  @Matches(/^0?\.\d+$/, { message: 'feeRate must be a decimal between 0 and 1' })
  @IsOptional()
  feeRate?: string;
}
