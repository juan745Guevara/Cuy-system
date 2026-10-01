import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../../../shared/guards/load-user-farms.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UserFarms } from '../../../shared/decorators/user-farms.decorator';
import { AuthUser, UserFarm } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FARMS_SERVICE } from '../../platform.tokens';

@ApiTags('Granjas')
@ApiBearerAuth('jwt')
@Controller('farms')
export class FarmsController {
  constructor(@Inject(FARMS_SERVICE) private readonly farmsService: any) {}

  @Get()
  @UseGuards(JwtAuthGuard, LoadUserFarmsGuard)
  @ApiOperation({ summary: 'Granjas accesibles para el usuario' })
  list(@UserFarms() userFarms: UserFarm[]) {
    return unwrapServiceResult(this.farmsService.list(userFarms));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Crear granja',
    description:
      'Si el nombre pertenece a una granja eliminada de la misma especie, la reactiva y la respuesta incluye `reactivada: true`.',
  })
  @ApiJsonBody(
    {
      nombre: 'string',
      id_especie: 'integer',
      ubicacion: 'string',
    },
    ['nombre', 'id_especie'],
  )
  async create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return unwrapServiceResult(
      await this.farmsService.create({
        userId: user.id,
        farmId: undefined,
        body,
      }),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Editar granja',
    description: 'Cambia nombre y ubicación. La especie no se puede cambiar.',
  })
  @ApiJsonBody({ nombre: 'string', ubicacion: 'string' }, ['nombre'])
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.farmsService.update({ userId: user.id, id: Number(id), body }),
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Eliminar granja (borrado lógico: queda inactiva)' })
  async deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.farmsService.deactivate({
        userId: user.id,
        farmId: undefined,
        id: Number(id),
      }),
    );
  }

  @Put(':id/users')
  @UseGuards(JwtAuthGuard, LoadUserFarmsGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reemplazar los usuarios asignados a la granja' })
  @ApiJsonBody({ usuario_ids: 'integer[]' }, ['usuario_ids'])
  async assignUsers(
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
    @Param('id') id: string,
    @Body() body: { usuario_ids?: number[] },
  ) {
    return unwrapServiceResult(
      await this.farmsService.assignUsers({
        userId: user.id,
        userRol: user.rol,
        userFarms,
        farmId: Number(id),
        usuario_ids: body?.usuario_ids,
      }),
    );
  }
}
