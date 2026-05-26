import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { PracticeService } from './practice.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@Controller('student/practice-sessions')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post()
  savePracticeSession(
    @CurrentUser() user: AuthUserDto,
    @Body() input: PracticeSessionDto,
  ) {
    return this.practiceService.savePracticeSession(user.id, input);
  }
}
