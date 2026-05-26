import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthSessionDto, AuthUserDto, JwtPayload } from './types';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<AuthSessionDto> {
    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hash(input.password, 12);
    const user = await this.usersService.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return this.createSession(user);
  }

  async login(input: LoginDto): Promise<AuthSessionDto> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user || user.role !== input.role) {
      throw new UnauthorizedException('Invalid email, password, or role');
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email, password, or role');
    }

    return this.createSession(user);
  }

  logout() {
    return undefined;
  }

  private createSession(user: AuthUserDto): AuthSessionDto {
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const payload: JwtPayload = {
      sub: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    };

    return {
      user: sessionUser,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
