import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService, type AuthUserRecord } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail'>>;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
    );
  });

  it('registers a user and returns a JWT session', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'user-1',
      name: 'Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      passwordHash: 'hashed',
    });

    const session = await authService.register({
      name: 'Teacher',
      email: 'teacher@example.com',
      password: 'password',
      role: 'teacher',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Teacher',
        email: 'teacher@example.com',
        role: 'teacher',
      }),
    );
    expect(session).toEqual({
      user: {
        id: 'user-1',
        name: 'Teacher',
        email: 'teacher@example.com',
        role: 'teacher',
      },
      accessToken: 'signed-token',
    });
  });

  it('rejects duplicate registrations', async () => {
    usersService.findByEmail.mockResolvedValue(createUserRecord());

    await expect(
      authService.register({
        name: 'Teacher',
        email: 'teacher@example.com',
        password: 'password',
        role: 'teacher',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in when email, password, and role match', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...createUserRecord(),
      passwordHash: await hash('password', 12),
    });

    const session = await authService.login({
      email: 'teacher@example.com',
      password: 'password',
      role: 'teacher',
    });

    expect(session.accessToken).toBe('signed-token');
    expect(session.user.role).toBe('teacher');
  });

  it('rejects login with the wrong role', async () => {
    usersService.findByEmail.mockResolvedValue(createUserRecord());

    await expect(
      authService.login({
        email: 'teacher@example.com',
        password: 'password',
        role: 'student',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function createUserRecord(): AuthUserRecord {
  return {
    id: 'user-1',
    name: 'Teacher',
    email: 'teacher@example.com',
    role: 'teacher',
    passwordHash: 'hashed',
  };
}
