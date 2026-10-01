import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
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
    ApiBearerAuth('jwt'),
    ApiHeader({ name: 'x-farm-id', description: 'ID de la granja activa', required: true }),
    ApiHeader({ name: 'x-species-id', description: 'ID de la especie de la granja', required: true }),
  );
}
