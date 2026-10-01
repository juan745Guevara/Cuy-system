import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserFarms } from '../../../shared/decorators/user-farms.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { UserFarm } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { INVENTORY_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Inventario')
@Controller('cuyes/inventory')
@FarmScope()
export class InventoryController {
  constructor(@Inject(INVENTORY_SERVICE) private readonly service: any) {}

  @Get('population')
  @ApiOperation({ summary: 'Población actual' })
  async population(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.getPopulation({ farmId, query }),
    );
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Resumen mensual de inventario' })
  async monthlySummary(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.getMonthlySummary({ farmId, query }),
    );
  }

  @Get('by-area')
  @ApiOperation({ summary: 'Inventario por área' })
  async byArea(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getByArea(farmId));
  }

  @Get('by-category-area')
  @ApiOperation({ summary: 'Inventario por categoría y área' })
  async byCategoryArea(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getByCategoryArea(farmId));
  }

  @Get('consolidated')
  @ApiOperation({ summary: 'Inventario consolidado de todas las granjas del usuario' })
  async consolidated(
    @UserFarms() userFarms: UserFarm[],
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.getConsolidated({ userFarms, query }),
    );
  }
}
