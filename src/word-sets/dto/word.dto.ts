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
  @IsString()
  @MinLength(1)
  term!: string;

  @IsString()
  @MinLength(1)
  translation!: string;

  @IsOptional()
  @IsString()
  exampleSentence = '';

  @IsOptional()
  @IsString()
  transcription: string | null = null;
}

export class AddWordsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WordInputDto)
  words!: WordInputDto[];
}

export class BulkDeleteWordsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  wordIds!: string[];
}
