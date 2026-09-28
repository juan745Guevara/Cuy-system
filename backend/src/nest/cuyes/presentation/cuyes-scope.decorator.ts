import { applyDecorators, UseGuards } from '@nestjs/common';
import { SpeciesGuard } from '../../shared/guards/species.guard';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../../shared/guards/load-user-farms.guard';
import { FarmAccessGuard } from '../../shared/guards/farm-access.guard';

/** Cuyes farm-scoped routes (species + JWT + farm access). */
export function CuyesFarmScope() {
  return applyDecorators(
    UseGuards(
      SpeciesGuard,
      JwtAuthGuard,
      LoadUserFarmsGuard,
      FarmAccessGuard,
    ),
  );
}
