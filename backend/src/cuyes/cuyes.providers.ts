import { Provider, Type } from '@nestjs/common';
import {
  SALES_SERVICE,
  WEANINGS_SERVICE,
  CATALOGS_SERVICE,
  BIRTHS_SERVICE,
  INVENTORY_SERVICE,
  MOVEMENTS_SERVICE,
  REPORTS_SERVICE,
  BREEDINGS_SERVICE,
  ALERTS_SERVICE,
  RANKING_SERVICE,
} from './cuyes.tokens';
import { CuyesDepsService } from './application/cuyes-deps.service';
import { SalesRepositoryPort } from './domain/ports/sales.repository.port';
import { SalesRepository } from './infrastructure/persistence/sales.repository';
import { SalesService } from './application/sales.service';
import { WeaningsRepositoryPort } from './domain/ports/weanings.repository.port';
import { WeaningsRepository } from './infrastructure/persistence/weanings.repository';
import { WeaningsService } from './application/weanings.service';
import { CatalogsRepositoryPort } from './domain/ports/catalogs.repository.port';
import { CatalogsRepository } from './infrastructure/persistence/catalogs.repository';
import { CatalogsService } from './application/catalogs.service';
import { BirthsRepositoryPort } from './domain/ports/births.repository.port';
import { BirthsRepository } from './infrastructure/persistence/births.repository';
import { BirthsService } from './application/births.service';
import { InventoryRepositoryPort } from './domain/ports/inventory.repository.port';
import { InventoryRepository } from './infrastructure/persistence/inventory.repository';
import { InventoryService } from './application/inventory.service';
import { AlertsRepositoryPort } from './domain/ports/alerts.repository.port';
import { AlertsRepository } from './infrastructure/persistence/alerts.repository';
import { AlertsService } from './application/alerts.service';
import { RankingRepositoryPort } from './domain/ports/ranking.repository.port';
import { RankingRepository } from './infrastructure/persistence/ranking.repository';
import { RankingService } from './application/ranking.service';
import { MovementsRepositoryPort } from './domain/ports/movements.repository.port';
import { MovementsRepository } from './infrastructure/persistence/movements.repository';
import { MovementsService } from './application/movements.service';
import { BreedingsRepositoryPort } from './domain/ports/breedings.repository.port';
import { BreedingsRepository } from './infrastructure/persistence/breedings.repository';
import { BreedingsService } from './application/breedings.service';
import { ReportsRepositoryPort } from './domain/ports/reports.repository.port';
import { ReportsRepository } from './infrastructure/persistence/reports.repository';
import { ReportsService } from './application/reports.service';

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
  ...migrated(SALES_SERVICE, SalesRepositoryPort, SalesRepository, SalesService),
  ...migrated(WEANINGS_SERVICE, WeaningsRepositoryPort, WeaningsRepository, WeaningsService),
  ...migrated(CATALOGS_SERVICE, CatalogsRepositoryPort, CatalogsRepository, CatalogsService),
  ...migrated(BIRTHS_SERVICE, BirthsRepositoryPort, BirthsRepository, BirthsService),
  ...migrated(INVENTORY_SERVICE, InventoryRepositoryPort, InventoryRepository, InventoryService),
  ...migrated(MOVEMENTS_SERVICE, MovementsRepositoryPort, MovementsRepository, MovementsService),
  ...migrated(REPORTS_SERVICE, ReportsRepositoryPort, ReportsRepository, ReportsService),
  ...migrated(BREEDINGS_SERVICE, BreedingsRepositoryPort, BreedingsRepository, BreedingsService),
  ...migrated(ALERTS_SERVICE, AlertsRepositoryPort, AlertsRepository, AlertsService),
  ...migrated(RANKING_SERVICE, RankingRepositoryPort, RankingRepository, RankingService),
];
