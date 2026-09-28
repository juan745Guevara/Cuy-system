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
import { AlertsService } from './services/alerts.service';
import { RankingService } from './services/ranking.service';
import { TreatmentsService } from './services/treatments.service';
import { AnimalsService } from './services/animals.service';
import { CagesService } from './services/cages.service';
import { WeighingsService } from './services/weighings.service';
import { MovementsService } from './services/movements.service';
import { BreedingsService } from './services/breedings.service';
import { ReportsService } from './services/reports.service';

function migrated(
  token: symbol,
  Repository: Type<unknown>,
  Service: Type<unknown>,
): Provider[] {
  return [Repository, Service, { provide: token, useExisting: Service }];
}

function delegated(token: symbol, Service: Type<unknown>): Provider[] {
  return [Service, { provide: token, useExisting: Service }];
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
  ...delegated(CAGES_SERVICE, CagesService),
  ...delegated(ANIMALS_SERVICE, AnimalsService),
  ...delegated(MOVEMENTS_SERVICE, MovementsService),
  ...delegated(WEIGHINGS_SERVICE, WeighingsService),
  ...delegated(TREATMENTS_SERVICE, TreatmentsService),
  ...delegated(REPORTS_SERVICE, ReportsService),
  ...delegated(BREEDINGS_SERVICE, BreedingsService),
  ...delegated(ALERTS_SERVICE, AlertsService),
  ...delegated(RANKING_SERVICE, RankingService),
];
