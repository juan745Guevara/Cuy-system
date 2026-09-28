import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Active species name set by SpeciesGuard (header x-species-id). */
export const SpeciesName = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.species?.nombre as string | undefined;
  },
);
