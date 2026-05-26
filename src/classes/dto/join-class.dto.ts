import { IsString, MinLength } from 'class-validator';

export class JoinClassDto {
  @IsString()
  @MinLength(1)
  inviteCode!: string;
}
