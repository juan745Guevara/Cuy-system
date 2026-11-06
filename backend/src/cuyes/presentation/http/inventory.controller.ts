import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
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

  @Get('counts')
  @ApiOperation({ summary: 'Conteos físicos de jaulas (filtros: desde, hasta, id_jaula)' })
  async listCounts(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(await this.service.listCounts({ farmId, query }));
  }

  @Post('counts')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar')
  @ApiOperation({ summary: 'Registrar conteo físico de una jaula y conciliarlo con el sistema' })
  @ApiJsonBody(
    {
      fecha: 'date',
      id_jaula: 'integer',
      machos_contados: 'integer',
      hembras_contadas: 'integer',
      peso_muestra1: 'number',
      peso_muestra2: 'number',
      peso_muestra3: 'number',
      observaciones: 'string',
    },
    ['fecha', 'id_jaula', 'machos_contados', 'hembras_contadas'],
  )
  async registerCount(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.registerCount({ farmId, userId: user.id, body }),
    );
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
