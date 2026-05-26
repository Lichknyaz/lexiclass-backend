export type UserRoleDto = 'teacher' | 'student';

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRoleDto;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRoleDto;
}
