import { IsOptional, IsString } from 'class-validator';

export class ListAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  wordSetId?: string;
}
