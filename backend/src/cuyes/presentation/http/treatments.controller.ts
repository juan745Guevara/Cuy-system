import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { TREATMENTS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Sanidad')
@Controller('cuyes/treatments')
@FarmScope()
export class TreatmentsController {
  constructor(@Inject(TREATMENTS_SERVICE) private readonly service: any) {}

  @Get('in-progress')
  @ApiOperation({ summary: 'Tratamientos en curso' })
  async listActive(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.listActive({ farmId, query }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Historial de tratamientos' })
  async list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(await this.service.list({ farmId, query }));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  @ApiOperation({
    summary: 'Registrar tratamiento',
    description: 'Destino: un animal (`id_animal`), varios (`ids_animales`), una jaula (`id_jaula`) o un área (`id_area`).',
  })
  @ApiJsonBody(
    {
      tipo: { type: 'string', example: 'curativo' },
      producto: 'string',
      dosis: 'string',
      via: 'string',
      fecha_inicio: 'date',
      duracion_dias: 'integer',
      diagnostico: 'string',
      responsable: 'string',
      id_animal: 'integer',
      ids_animales: 'integer[]',
      id_jaula: 'integer',
      id_area: 'integer',
    },
    ['producto', 'fecha_inicio', 'duracion_dias'],
  )
  async create(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({
        farmId,
        userId: user.id,
        user,
        body,
      }),
    );
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  @ApiOperation({ summary: 'Finalizar tratamiento' })
  @ApiJsonBody({ motivo_cierre: 'string' })
  async complete(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.complete({
        farmId,
        userId: user.id,
        id,
        body,
      }),
    );
  }
}
