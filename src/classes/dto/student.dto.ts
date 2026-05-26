import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class StudentDto {
  @ApiProperty({ example: 'Demo Student' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email!: string;
}
