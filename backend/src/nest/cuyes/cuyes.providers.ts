import { Provider, Type } from '@nestjs/common';
import {
  AREAS_SERVICE,
  MORTALITY_SERVICE,
  SALES_SERVICE,
  WEANINGS_SERVICE,
  CATALOGS_SERVICE,
  BIRTHS_SERVICE,
  INVENTORY_SERVICE,
  CAGES_SERVICE,
  ANIMALS_SERVICE,
  MOVEMENTS_SERVICE,
  WEIGHINGS_SERVICE,
  TREATMENTS_SERVICE,
  REPORTS_SERVICE,
  BREEDINGS_SERVICE,
  ALERTS_SERVICE,
  RANKING_SERVICE,
} from './cuyes.tokens';
import { CuyesDepsService } from './application/cuyes-deps.service';
import { AreasRepositoryPort } from './domain/ports/areas.repository.port';
import { AreasRepository } from './infrastructure/persistence/areas.repository';
import { AreasService } from './application/services/areas.service';
import { MortalityRepositoryPort } from './domain/ports/mortality.repository.port';
import { MortalityRepository } from './infrastructure/persistence/mortality.repository';
import { MortalityService } from './application/services/mortality.service';
import { SalesRepositoryPort } from './domain/ports/sales.repository.port';
import { SalesRepository } from './infrastructure/persistence/sales.repository';
import { SalesService } from './application/services/sales.service';
import { WeaningsRepositoryPort } from './domain/ports/weanings.repository.port';
import { WeaningsRepository } from './infrastructure/persistence/weanings.repository';
import { WeaningsService } from './application/services/weanings.service';
import { CatalogsRepositoryPort } from './domain/ports/catalogs.repository.port';
import { CatalogsRepository } from './infrastructure/persistence/catalogs.repository';
import { CatalogsService } from './application/services/catalogs.service';
import { BirthsRepositoryPort } from './domain/ports/births.repository.port';
import { BirthsRepository } from './infrastructure/persistence/births.repository';
import { BirthsService } from './application/services/births.service';
import { InventoryRepositoryPort } from './domain/ports/inventory.repository.port';
import { InventoryRepository } from './infrastructure/persistence/inventory.repository';
import { InventoryService } from './application/services/inventory.service';
import { AlertsRepositoryPort } from './domain/ports/alerts.repository.port';
import { AlertsRepository } from './infrastructure/persistence/alerts.repository';
import { AlertsService } from './application/services/alerts.service';
import { RankingRepositoryPort } from './domain/ports/ranking.repository.port';
import { RankingRepository } from './infrastructure/persistence/ranking.repository';
import { RankingService } from './application/services/ranking.service';
import { TreatmentsRepositoryPort } from './domain/ports/treatments.repository.port';
import { TreatmentsRepository } from './infrastructure/persistence/treatments.repository';
import { TreatmentsService } from './application/services/treatments.service';
import { CagesRepositoryPort } from './domain/ports/cages.repository.port';
import { CagesRepository } from './infrastructure/persistence/cages.repository';
import { CagesService } from './application/services/cages.service';
import { WeighingsRepositoryPort } from './domain/ports/weighings.repository.port';
import { WeighingsRepository } from './infrastructure/persistence/weighings.repository';
import { WeighingsService } from './application/services/weighings.service';
import { AnimalsRepositoryPort } from './domain/ports/animals.repository.port';
import { AnimalsRepository } from './infrastructure/persistence/animals.repository';
import { AnimalsService } from './application/services/animals.service';
import { MovementsRepositoryPort } from './domain/ports/movements.repository.port';
import { MovementsRepository } from './infrastructure/persistence/movements.repository';
import { MovementsService } from './application/services/movements.service';
import { BreedingsRepositoryPort } from './domain/ports/breedings.repository.port';
import { BreedingsRepository } from './infrastructure/persistence/breedings.repository';
import { BreedingsService } from './application/services/breedings.service';
import { ReportsRepositoryPort } from './domain/ports/reports.repository.port';
import { ReportsRepository } from './infrastructure/persistence/reports.repository';
import { ReportsService } from './application/services/reports.service';

function migrated(
  token: symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Port: any,
  Repository: Type<unknown>,
  Service: Type<unknown>,
): Provider[] {
  return [
    Repository,
    { provide: Port, useExisting: Repository },
    Service,
    { provide: token, useExisting: Service },
  ];
}

export const cuyesProviders: Provider[] = [
  CuyesDepsService,
  ...migrated(AREAS_SERVICE, AreasRepositoryPort, AreasRepository, AreasService),
  ...migrated(MORTALITY_SERVICE, MortalityRepositoryPort, MortalityRepository, MortalityService),
  ...migrated(SALES_SERVICE, SalesRepositoryPort, SalesRepository, SalesService),
  ...migrated(WEANINGS_SERVICE, WeaningsRepositoryPort, WeaningsRepository, WeaningsService),
  ...migrated(CATALOGS_SERVICE, CatalogsRepositoryPort, CatalogsRepository, CatalogsService),
  ...migrated(BIRTHS_SERVICE, BirthsRepositoryPort, BirthsRepository, BirthsService),
  ...migrated(INVENTORY_SERVICE, InventoryRepositoryPort, InventoryRepository, InventoryService),
  ...migrated(CAGES_SERVICE, CagesRepositoryPort, CagesRepository, CagesService),
  ...migrated(ANIMALS_SERVICE, AnimalsRepositoryPort, AnimalsRepository, AnimalsService),
  ...migrated(MOVEMENTS_SERVICE, MovementsRepositoryPort, MovementsRepository, MovementsService),
  ...migrated(WEIGHINGS_SERVICE, WeighingsRepositoryPort, WeighingsRepository, WeighingsService),
  ...migrated(TREATMENTS_SERVICE, TreatmentsRepositoryPort, TreatmentsRepository, TreatmentsService),
  ...migrated(REPORTS_SERVICE, ReportsRepositoryPort, ReportsRepository, ReportsService),
  ...migrated(BREEDINGS_SERVICE, BreedingsRepositoryPort, BreedingsRepository, BreedingsService),
  ...migrated(ALERTS_SERVICE, AlertsRepositoryPort, AlertsRepository, AlertsService),
  ...migrated(RANKING_SERVICE, RankingRepositoryPort, RankingRepository, RankingService),
];
