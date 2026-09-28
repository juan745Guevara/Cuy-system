import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFarm } from '../auth/auth-user.types';

export const UserFarms = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserFarm[] => {
    const req = ctx.switchToHttp().getRequest();
    return req.userFarms || [];
  },
);
