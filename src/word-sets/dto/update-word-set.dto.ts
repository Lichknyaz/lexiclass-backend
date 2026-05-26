import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateWordSetDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description = '';

  @IsOptional()
  @IsString()
  tag = '';
}
