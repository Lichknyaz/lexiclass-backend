import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WordInputDto {
  @ApiProperty({ example: 'depart' })
  @IsString()
  @MinLength(1)
  term!: string;

  @ApiProperty({ example: 'to leave' })
  @IsString()
  @MinLength(1)
  translation!: string;

  @ApiPropertyOptional({
    example: 'The train departs at noon.',
    default: '',
  })
  @IsOptional()
  @IsString()
  exampleSentence = '';

  @ApiPropertyOptional({ example: 'di-PAHRT', nullable: true, default: null })
  @IsOptional()
  @IsString()
  transcription: string | null = null;
}

export class AddWordsDto {
  @ApiProperty({ type: [WordInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WordInputDto)
  words!: WordInputDto[];
}

export class BulkDeleteWordsDto {
  @ApiProperty({ example: ['word-id-1', 'word-id-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  wordIds!: string[];
}
