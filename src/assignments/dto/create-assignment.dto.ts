import { IsString, MinLength } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @MinLength(1)
  classId!: string;

  @IsString()
  @MinLength(1)
  wordSetId!: string;
}
