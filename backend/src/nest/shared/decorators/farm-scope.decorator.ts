import { applyDecorators, UseGuards } from '@nestjs/common';
import { SpeciesGuard } from '../guards/species.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../guards/load-user-farms.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';

/** Farm-scoped routes (species + JWT + farm access). */
export function FarmScope() {
  return applyDecorators(
    UseGuards(
      SpeciesGuard,
      JwtAuthGuard,
      LoadUserFarmsGuard,
      FarmAccessGuard,
    ),
  );
}
