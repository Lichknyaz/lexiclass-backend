import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserDto, UserRoleDto } from '../auth/types';

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRoleDto;
}

export type AuthUserRecord = AuthUserDto & {
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<AuthUserRecord> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        role: toPrismaRole(input.role),
      },
    });

    return toAuthUserRecord(user);
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizeEmail(email),
      },
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async findDtoById(id: string): Promise<AuthUserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? toAuthUserDto(user) : null;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPrismaRole(role: UserRoleDto) {
  return role === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
}

function toDtoRole(role: UserRole): UserRoleDto {
  return role === UserRole.TEACHER ? 'teacher' : 'student';
}

function toAuthUserDto(user: User): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toDtoRole(user.role),
  };
}

function toAuthUserRecord(user: User): AuthUserRecord {
  return {
    ...toAuthUserDto(user),
    passwordHash: user.passwordHash,
  };
}
