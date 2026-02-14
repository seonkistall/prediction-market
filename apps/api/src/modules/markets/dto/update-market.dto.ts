import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdateMarketDto {
  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @Matches(/^\d+\.?\d*$/, { message: 'minBet must be a valid decimal number' })
  @IsOptional()
  minBet?: string;

  @ApiProperty({ required: false })
  @IsString()
  @Matches(/^\d+\.?\d*$/, { message: 'maxBet must be a valid decimal number' })
  @IsOptional()
  maxBet?: string;

  @ApiProperty({ required: false })
  @IsString()
  @Matches(/^0?\.\d+$/, { message: 'feeRate must be a decimal between 0 and 1' })
  @IsOptional()
  feeRate?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
