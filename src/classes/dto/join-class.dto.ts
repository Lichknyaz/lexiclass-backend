import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JoinClassDto {
  @ApiProperty({ example: 'A2-7KQ9' })
  @IsString()
  @MinLength(1)
  inviteCode!: string;
}
