import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller';
import { CagesController } from './cages.controller';
import { AnimalsController } from './animals.controller';
import { CatalogsController } from './catalogs.controller';
import { MovementsController } from './movements.controller';
import { MortalityController } from './mortality.controller';
import { SalesController } from './sales.controller';
import { InventoryController } from './inventory.controller';
import { WeighingsController } from './weighings.controller';
import { TreatmentsController } from './treatments.controller';
import { ReportsController } from './reports.controller';
import { BreedingsController } from './breedings.controller';
import { BirthsController } from './births.controller';
import { WeaningsController } from './weanings.controller';
import { AlertsController } from './alerts.controller';
import { RankingController } from './ranking.controller';
import { cuyesProviders } from './cuyes.providers';
import { CuyesDepsService } from './cuyes-deps.service';
import { SpeciesGuard } from '../shared/guards/species.guard';

@Module({
  controllers: [
    AreasController,
    CagesController,
    AnimalsController,
    CatalogsController,
    MovementsController,
    MortalityController,
    SalesController,
    InventoryController,
    WeighingsController,
    TreatmentsController,
    ReportsController,
    BreedingsController,
    BirthsController,
    WeaningsController,
    AlertsController,
    RankingController,
  ],
  providers: [...cuyesProviders, SpeciesGuard],
  exports: [CuyesDepsService],
})
export class CuyesModule {}
