import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateClassDto {
  @ApiProperty({ example: 'English A2' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    example: 'Core vocabulary for travel and everyday communication.',
  })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'A2' })
  @IsString()
  level!: string;
}
