import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'word-id' })
  @IsString()
  @MinLength(1)
  wordId!: string;

  @ApiProperty({ enum: ['correct', 'wrong'], example: 'correct' })
  @IsIn(['correct', 'wrong'])
  status!: AnswerStatusDto;

  @ApiProperty({ example: '2026-05-26T10:00:00.000Z' })
  @IsISO8601()
  answeredAt!: string;
}

export class PracticeSessionDto {
  @ApiProperty({ example: 'assignment-id' })
  @IsString()
  @MinLength(1)
  assignmentId!: string;

  @ApiProperty({
    enum: ['flashcard', 'multiple_choice', 'writing'],
    example: 'writing',
  })
  @IsIn(['flashcard', 'multiple_choice', 'writing'])
  mode!: PracticeModeDto;

  @ApiProperty({ type: [PracticeAttemptInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PracticeAttemptInputDto)
  attempts!: PracticeAttemptInputDto[];
}
