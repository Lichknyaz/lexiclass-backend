import { SetMetadata } from '@nestjs/common';
import type { UserRoleDto } from './types';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRoleDto[]) => SetMetadata(ROLES_KEY, roles);
