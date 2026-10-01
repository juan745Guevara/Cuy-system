import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { WEIGHINGS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Pesajes')
@Controller('cuyes/weighings')
@FarmScope()
export class WeighingsController {
  constructor(@Inject(WEIGHINGS_SERVICE) private readonly service: any) {}

  @Get('ranges')
  @ApiOperation({ summary: 'Rangos de peso esperados por categoría' })
  async getRanges(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getRanges(farmId));
  }

  @Get('average')
  @ApiOperation({ summary: 'Peso promedio' })
  async getAverage(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.getAverage({ farmId, query }),
    );
  }

  @Get('animal/:id_animal')
  @ApiOperation({ summary: 'Evolución de peso de un animal' })
  async animalTrend(
    @FarmId() farmId: number,
    @Param('id_animal') animalId: string,
  ) {
    return unwrapServiceResult(
      await this.service.animalTrend({ farmId, animalId }),
    );
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  @ApiOperation({ summary: 'Registrar pesajes por lote' })
  @ApiJsonBody(
    {
      fecha: 'date',
      pesajes: {
        type: 'object[]',
        description: 'Cada elemento: { id_animal, peso_gramos, confirmar_fuera_rango? }',
        example: [{ id_animal: 1, peso_gramos: 850 }],
      },
      confirmar_fuera_rango: 'boolean',
    },
    ['fecha', 'pesajes'],
  )
  async createBatch(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBatch({ farmId, userId: user.id, body }),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  @ApiOperation({ summary: 'Registrar pesaje individual' })
  @ApiJsonBody(
    {
      id_animal: 'integer',
      fecha: 'date',
      peso_gramos: 'number',
      confirmar_fuera_rango: 'boolean',
    },
    ['id_animal', 'fecha', 'peso_gramos'],
  )
  async create(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({ farmId, userId: user.id, body }),
    );
  }

  @Put('ranges')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({
    summary: 'Actualizar rangos de peso',
    description: 'Objeto con una entrada por categoría: `{ "<categoria>": { "min": number, "max": number } }`.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { min: { type: 'number' }, max: { type: 'number' } },
      },
    },
  })
  async updateRanges(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.updateRangos({
        farmId,
        userId: user.id,
        body: body || {},
      }),
    );
  }
}
