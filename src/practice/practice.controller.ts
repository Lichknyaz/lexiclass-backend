import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { PracticeService } from './practice.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@ApiTags('Practice')
@ApiBearerAuth()
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@ApiTags('Student Progress')
@ApiBearerAuth()
@Controller('student/progress')
export class StudentProgressController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('words')
  listWordProgress(@CurrentUser() user: AuthUserDto) {
    return this.practiceService.listStudentWordProgress(user.id);
  }
}
