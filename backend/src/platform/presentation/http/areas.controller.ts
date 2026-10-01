import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { SpeciesName } from '../../../shared/decorators/species-name.decorator';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { AREAS_SERVICE } from '../../platform.tokens';

@ApiTags('Áreas')
@Controller('areas')
@FarmScope()
export class AreasController {
  constructor(@Inject(AREAS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar áreas de la granja' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de ocupación por área' })
  async summary(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getSummary(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({
    summary: 'Crear área',
    description:
      '`jaula_ids` mueve jaulas existentes a la nueva área. Si el nombre es de un área eliminada, la reactiva (`reactivada: true`).',
  })
  @ApiJsonBody(
    { nombre: 'string', proposito: 'string', jaula_ids: 'integer[]' },
    ['nombre'],
  )
  async create(
    @FarmId() farmId: number,
    @SpeciesName() speciesNombre: string | undefined,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({ farmId, userId: user.id, speciesNombre, body }),
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({
    summary: 'Editar área',
    description:
      'Cambia nombre y propósito (texto libre, opcional). `jaula_ids` mueve esas jaulas (de otras áreas de la granja) a esta área.',
  })
  @ApiJsonBody(
    { nombre: 'string', proposito: 'string', jaula_ids: 'integer[]' },
    ['nombre'],
  )
  async update(
    @FarmId() farmId: number,
    @SpeciesName() speciesNombre: string | undefined,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.update({ farmId, userId: user.id, speciesNombre, id: Number(id), body }),
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({ summary: 'Eliminar área (borrado lógico; sus jaulas quedan sin área)' })
  async deactivate(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return unwrapServiceResult(
      await this.service.deactivate({
        farmId,
        userId: user.id,
        id: Number(id),
      }),
    );
  }
}
