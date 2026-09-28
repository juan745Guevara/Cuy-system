import { Module, OnModuleInit } from '@nestjs/common';
import { CagesController } from './presentation/http/cages.controller';
import { AnimalsController } from './presentation/http/animals.controller';
import { CatalogsController } from './presentation/http/catalogs.controller';
import { MovementsController } from './presentation/http/movements.controller';
import { MortalityController } from './presentation/http/mortality.controller';
import { SalesController } from './presentation/http/sales.controller';
import { InventoryController } from './presentation/http/inventory.controller';
import { WeighingsController } from './presentation/http/weighings.controller';
import { TreatmentsController } from './presentation/http/treatments.controller';
import { ReportsController } from './presentation/http/reports.controller';
import { BreedingsController } from './presentation/http/breedings.controller';
import { BirthsController } from './presentation/http/births.controller';
import { WeaningsController } from './presentation/http/weanings.controller';
import { AlertsController } from './presentation/http/alerts.controller';
import { RankingController } from './presentation/http/ranking.controller';
import { cuyesProviders } from './cuyes.providers';
import { CuyesDepsService } from './application/cuyes-deps.service';
import { AreaRulesRegistry } from '../shared/species/area-rules-registry.service';
import { cuyesAreaRules } from '../shared/species/cuyes/cuyes-area-rules';

@Module({
  controllers: [
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
  providers: [...cuyesProviders],
  exports: [CuyesDepsService],
})
export class CuyesModule implements OnModuleInit {
  constructor(private readonly areaRulesRegistry: AreaRulesRegistry) {}

  onModuleInit() {
    this.areaRulesRegistry.register('cuyes', cuyesAreaRules);
  }
}
