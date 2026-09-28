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
import { CuyesDepsService } from './cuyes-deps.service';
import { AreasRepository } from './repositories/areas.repository';
import { AreasService } from './services/areas.service';
import { MortalityRepository } from './repositories/mortality.repository';
import { MortalityService } from './services/mortality.service';
import { SalesRepository } from './repositories/sales.repository';
import { SalesService } from './services/sales.service';
import { WeaningsRepository } from './repositories/weanings.repository';
import { WeaningsService } from './services/weanings.service';
import { CatalogsRepository } from './repositories/catalogs.repository';
import { CatalogsService } from './services/catalogs.service';
import { BirthsRepository } from './repositories/births.repository';
import { BirthsService } from './services/births.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryService } from './services/inventory.service';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertsService } from './services/alerts.service';
import { RankingRepository } from './repositories/ranking.repository';
import { RankingService } from './services/ranking.service';
import { TreatmentsRepository } from './repositories/treatments.repository';
import { TreatmentsService } from './services/treatments.service';
import { CagesRepository } from './repositories/cages.repository';
import { CagesService } from './services/cages.service';
import { WeighingsRepository } from './repositories/weighings.repository';
import { WeighingsService } from './services/weighings.service';
import { AnimalsRepository } from './repositories/animals.repository';
import { AnimalsService } from './services/animals.service';
import { MovementsRepository } from './repositories/movements.repository';
import { MovementsService } from './services/movements.service';
import { BreedingsRepository } from './repositories/breedings.repository';
import { BreedingsService } from './services/breedings.service';
import { ReportsRepository } from './repositories/reports.repository';
import { ReportsService } from './services/reports.service';

function migrated(
  token: symbol,
  Repository: Type<unknown>,
  Service: Type<unknown>,
): Provider[] {
  return [Repository, Service, { provide: token, useExisting: Service }];
}

export const cuyesProviders: Provider[] = [
  CuyesDepsService,
  ...migrated(AREAS_SERVICE, AreasRepository, AreasService),
  ...migrated(MORTALITY_SERVICE, MortalityRepository, MortalityService),
  ...migrated(SALES_SERVICE, SalesRepository, SalesService),
  ...migrated(WEANINGS_SERVICE, WeaningsRepository, WeaningsService),
  ...migrated(CATALOGS_SERVICE, CatalogsRepository, CatalogsService),
  ...migrated(BIRTHS_SERVICE, BirthsRepository, BirthsService),
  ...migrated(INVENTORY_SERVICE, InventoryRepository, InventoryService),
  ...migrated(CAGES_SERVICE, CagesRepository, CagesService),
  ...migrated(ANIMALS_SERVICE, AnimalsRepository, AnimalsService),
  ...migrated(MOVEMENTS_SERVICE, MovementsRepository, MovementsService),
  ...migrated(WEIGHINGS_SERVICE, WeighingsRepository, WeighingsService),
  ...migrated(TREATMENTS_SERVICE, TreatmentsRepository, TreatmentsService),
  ...migrated(REPORTS_SERVICE, ReportsRepository, ReportsService),
  ...migrated(BREEDINGS_SERVICE, BreedingsRepository, BreedingsService),
  ...migrated(ALERTS_SERVICE, AlertsRepository, AlertsService),
  ...migrated(RANKING_SERVICE, RankingRepository, RankingService),
];
