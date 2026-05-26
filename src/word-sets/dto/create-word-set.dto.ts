import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWordSetDto {
  @ApiProperty({ example: 'Travel basics' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({
    example: 'Airport, hotel, and route vocabulary.',
    default: '',
  })
  @IsOptional()
  @IsString()
  description = '';
}
