import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { UserRoleDto } from '../types';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsIn(['teacher', 'student'])
  role!: UserRoleDto;
}
