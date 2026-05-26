import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWordSetDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description = '';
}
