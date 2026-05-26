import { IsEmail, IsString, MinLength } from 'class-validator';

export class StudentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;
}
