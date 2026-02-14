import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, Matches } from 'class-validator';
import { BetPosition } from '../../../entities/bet.entity';

export class PlaceBetDto {
  @ApiProperty({ example: 'uuid-of-round' })
  @IsUUID()
  roundId: string;

  @ApiProperty({ enum: BetPosition, example: BetPosition.UP })
  @IsEnum(BetPosition)
  position: BetPosition;

  @ApiProperty({ example: '0.01', description: 'Bet amount in ETH' })
  @IsString()
  @Matches(/^\d+\.?\d*$/, { message: 'Amount must be a valid decimal number' })
  amount: string;
}
