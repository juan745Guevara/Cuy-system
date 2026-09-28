import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const FarmId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest();
    return req.farmId;
  },
);
