import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserDto } from './types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserDto => {
    const request = context.switchToHttp().getRequest<{ user: AuthUserDto }>();
    return request.user;
  },
);
