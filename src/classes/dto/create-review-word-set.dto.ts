import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateReviewWordSetDto {
  @ApiProperty({ example: 'Review: English A2 - Travel' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({
    example: 'Review set created from weak words for English A2 - Travel.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'A2 review' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ example: ['cmat1word0001', 'cmat1word0002'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  wordIds!: string[];

  @ApiProperty({
    example: true,
    description:
      'When true, the created review word set is assigned to this class. Frontend defaults this to true.',
  })
  @IsBoolean()
  assignToClass!: boolean;
}
