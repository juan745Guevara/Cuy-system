import { Injectable } from '@nestjs/common';
import { ok } from '../../shared/kernel/service-result.kernel';
import { SpeciesRepository } from '../repositories/species.repository';
import { UserFarm } from '../../shared/auth/auth-user.types';

@Injectable()
export class SpeciesService {
  constructor(private readonly repository: SpeciesRepository) {}

  async list() {
    return ok(await this.repository.listActive());
  }

  listForUser(userFarms: UserFarm[]) {
    const map = new Map<number, { id: number; name: string }>();
    for (const farm of userFarms || []) {
      if (farm.id_especie && !map.has(farm.id_especie)) {
        map.set(farm.id_especie, {
          id: farm.id_especie,
          name: farm.especie || String(farm.id_especie),
        });
      }
    }
    return ok(
      [...map.values()].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }
}
