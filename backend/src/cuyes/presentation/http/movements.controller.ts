import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UserFarms } from '../../../shared/decorators/user-farms.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser, UserFarm } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { MOVEMENTS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Movimientos')
@Controller('cuyes/movements')
@FarmScope()
export class MovementsController {
  constructor(@Inject(MOVEMENTS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar movimientos' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Get('overcapacity')
  @ApiOperation({ summary: 'Jaulas sobre su capacidad' })
  async overcapacity(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.listOvercapacity(farmId));
  }

  @Get('out-of-area')
  @ApiOperation({ summary: 'Animales fuera del área que corresponde a su categoría' })
  async outOfArea(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.listOutOfArea(farmId));
  }

  @Get('destination-cages/:farm_id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Jaulas disponibles en otra granja (para traslados)' })
  async destinationCages(
    @FarmId() farmId: number,
    @Param('farm_id') farmIdDestino: string,
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
  ) {
    return unwrapServiceResult(
      await this.service.destinationCages({
        farmId,
        farmIdDestino,
        user,
        userFarms,
      }),
    );
  }

  @Get('animal/:id_animal')
  @ApiOperation({ summary: 'Historial de movimientos de un animal' })
  async animalHistory(
    @FarmId() farmId: number,
    @Param('id_animal') animalId: string,
  ) {
    return unwrapServiceResult(
      await this.service.animalHistory({ farmId, animalId }),
    );
  }

  @Get('cage/:cage_id')
  @ApiOperation({ summary: 'Historial de movimientos de una jaula' })
  async cageHistory(
    @FarmId() farmId: number,
    @Param('cage_id') cageId: string,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.cageHistory({
        farmId,
        jaulaId: Number(cageId),
        query,
      }),
    );
  }

  @Post('relocate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  @ApiOperation({
    summary: 'Reubicar animales dentro de la granja',
    description: 'Enviar `ids_animales` o `id_jaula_origen_completa` para mover toda una jaula.',
  })
  @ApiJsonBody(
    {
      fecha: 'date',
      id_jaula_destino: 'integer',
      ids_animales: 'integer[]',
      id_jaula_origen_completa: 'integer',
      motivo: 'string',
      confirmar_capacidad: 'boolean',
      confirmar_area: 'boolean',
    },
    ['fecha', 'id_jaula_destino'],
  )
  async relocate(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.relocate({ farmId, userId: user.id, body }),
    );
  }

  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Trasladar animales a otra granja de la misma especie' })
  @ApiJsonBody(
    {
      fecha: 'date',
      id_granja_destino: 'integer',
      id_jaula_destino: 'integer',
      ids_animales: 'integer[]',
      motivo: 'string',
      confirmar_capacidad: 'boolean',
    },
    ['fecha', 'id_granja_destino', 'id_jaula_destino', 'ids_animales', 'motivo'],
  )
  async transfer(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.transfer({
        farmId,
        userId: user.id,
        user,
        userFarms,
        body,
      }),
    );
  }
}
