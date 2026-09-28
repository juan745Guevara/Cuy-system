import { Controller, Get, Inject, Query } from '@nestjs/common';
import { UserFarms } from '../../../shared/decorators/user-farms.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { UserFarm } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { CuyesFarmScope } from '../cuyes-scope.decorator';
import { INVENTORY_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/inventory')
@CuyesFarmScope()
export class InventoryController {
  constructor(@Inject(INVENTORY_SERVICE) private readonly service: any) {}

  @Get('population')
  population(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      this.service.getPopulation({ farmId, query }),
    );
  }

  @Get('monthly-summary')
  monthlySummary(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      this.service.getMonthlySummary({ farmId, query }),
    );
  }

  @Get('by-area')
  byArea(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getByArea(farmId));
  }

  @Get('by-category-area')
  byCategoryArea(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getByCategoryArea(farmId));
  }

  @Get('consolidated')
  consolidated(
    @UserFarms() userFarms: UserFarm[],
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      this.service.getConsolidated({ userFarms, query }),
    );
  }
}
