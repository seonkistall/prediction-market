import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with stats' })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfileWithStats(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user betting statistics' })
  async getStats(@CurrentUser() user: User) {
    return this.usersService.getBettingStats(user.id);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get user betting history summary' })
  async getHistory(@CurrentUser() user: User) {
    return this.usersService.getBettingHistory(user.id);
  }
}
