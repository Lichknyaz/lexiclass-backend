import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
import { TeacherAnalyticsResponseDto } from '../swagger/api-response.dto';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('teacher/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get teacher analytics and problem words' })
  @ApiOkResponse({ type: TeacherAnalyticsResponseDto })
  getAnalytics(
    @CurrentUser() user: AuthUserDto,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTeacherAnalytics(user.id, query);
  }
}
