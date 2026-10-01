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
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { RECINTOS_SERVICE } from '../../platform.tokens';

@ApiTags('Recintos (jaulas)')
@Controller('recintos')
@FarmScope()
export class RecintosController {
  constructor(@Inject(RECINTOS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar jaulas de la granja' })
  async list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(await this.service.list({ farmId, query }));
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Ocupación de jaulas' })
  async occupancy(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getOccupancy(farmId));
  }

  @Get(':id/animals')
  @ApiOperation({ summary: 'Animales en una jaula' })
  async animals(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getAnimals({ farmId, jaulaId: id }),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({ summary: 'Crear jaula', description: '`id_area` es opcional: la jaula puede quedar sin área.' })
  @ApiJsonBody(
    { codigo: 'string', id_area: 'integer', capacidad_maxima: 'integer' },
    ['codigo'],
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

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({ summary: 'Eliminar jaula (borrado lógico; debe estar vacía)' })
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  @ApiOperation({ summary: 'Editar jaula', description: '`id_area: null` quita la jaula de su área.' })
  @ApiJsonBody({ codigo: 'string', id_area: 'integer', capacidad_maxima: 'integer' })
  async update(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.update({
        farmId,
        userId: user.id,
        id: Number(id),
        body,
      }),
    );
  }
}
