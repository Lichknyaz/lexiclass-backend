import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('allows users with a matching role', () => {
    const guard = new RolesGuard(createReflector(['teacher']));

    expect(guard.canActivate(createContext('teacher'))).toBe(true);
  });

  it('rejects users with a non-matching role', () => {
    const guard = new RolesGuard(createReflector(['teacher']));

    expect(guard.canActivate(createContext('student'))).toBe(false);
  });
});

function createReflector(roles: string[]) {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
}

function createContext(role: 'teacher' | 'student') {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: 'user-1',
          name: 'User',
          email: 'user@example.com',
          role,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}
