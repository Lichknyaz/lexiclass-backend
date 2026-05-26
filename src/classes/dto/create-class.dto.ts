import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'English A2' })
  @IsString()
  @MinLength(1)
  name!: string;
}
