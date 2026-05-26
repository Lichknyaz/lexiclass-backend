import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsISO8601,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type PracticeModeDto = 'flashcard' | 'multiple_choice' | 'writing';
export type AnswerStatusDto = 'correct' | 'wrong';

export class PracticeAttemptInputDto {
  @IsString()
  @MinLength(1)
  wordId!: string;

  @IsIn(['correct', 'wrong'])
  status!: AnswerStatusDto;

  @IsISO8601()
  answeredAt!: string;
}

export class PracticeSessionDto {
  @IsString()
  @MinLength(1)
  assignmentId!: string;

  @IsIn(['flashcard', 'multiple_choice', 'writing'])
  mode!: PracticeModeDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PracticeAttemptInputDto)
  attempts!: PracticeAttemptInputDto[];
}
