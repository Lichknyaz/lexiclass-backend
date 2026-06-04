import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  analyticsProblemWordWindows,
  AnalyticsProblemWordWindow,
} from '../../analytics/dto/analytics-query.dto';

export const reviewWordSources = ['weak', 'all'] as const;
export type ReviewWordSource = (typeof reviewWordSources)[number];

export class ReviewWordsQueryDto {
  @ApiProperty({
    enum: reviewWordSources,
    example: 'weak',
    description:
      'Review word source. weak returns class problem words; all returns every word assigned to the class.',
  })
  @IsIn(reviewWordSources)
  source!: ReviewWordSource;

  @ApiPropertyOptional({
    enum: analyticsProblemWordWindows,
    example: '14',
    description:
      'Problem-word time window used when source is weak. Defaults to 14 days.',
  })
  @IsOptional()
  @IsIn(analyticsProblemWordWindows)
  problemWordWindow?: AnalyticsProblemWordWindow;
}
