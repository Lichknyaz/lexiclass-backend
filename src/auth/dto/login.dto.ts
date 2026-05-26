import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { UserRoleDto } from '../types';

export class LoginDto {
  @ApiProperty({ example: 'teacher@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ enum: ['teacher', 'student'], example: 'teacher' })
  @IsIn(['teacher', 'student'])
  role!: UserRoleDto;
}
