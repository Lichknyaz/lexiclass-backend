import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'class-id' })
  @IsString()
  @MinLength(1)
  classId!: string;

  @ApiProperty({ example: 'word-set-id' })
  @IsString()
  @MinLength(1)
  wordSetId!: string;
}
