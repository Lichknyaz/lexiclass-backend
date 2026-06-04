import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const analyticsProblemWordWindows = ['14', '30', '90', 'all'] as const;
export type AnalyticsProblemWordWindow =
  (typeof analyticsProblemWordWindows)[number];

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 'class-id' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({
    enum: analyticsProblemWordWindows,
    default: '14',
    description:
      'Time window for problem-word analytics. Numeric values use actionable threshold filtering; all returns every historical word with wrong attempts.',
  })
  @IsOptional()
  @IsIn(analyticsProblemWordWindows)
  problemWordWindow?: AnalyticsProblemWordWindow;
}
