import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../../../shared/guards/load-user-farms.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { USERS_SERVICE } from '../../platform.tokens';

@ApiTags('Usuarios')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class UsersController {
  constructor(@Inject(USERS_SERVICE) private readonly usersService: any) {}

  @Post()
  @UseGuards(LoadUserFarmsGuard)
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Si el email pertenece a una cuenta eliminada (inactiva), la reactiva con los nuevos datos y la respuesta incluye `reactivada: true`.',
  })
  @ApiJsonBody(
    {
      nombre: 'string',
      email: 'string',
      password: 'string',
      rol: { type: 'string', enum: ['admin', 'encargado', 'supervisor', 'auxiliar'] },
      especie_ids: { type: 'integer[]', description: 'Módulos (solo superadmin)' },
      granja_ids: 'integer[]',
    },
    ['nombre', 'email', 'password', 'rol'],
  )
  async create(
    @CurrentUser() user: AuthUser,
    @Headers('x-farm-id') farmIdHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const farmId = Number(farmIdHeader) || undefined;
    return unwrapServiceResult(
      await this.usersService.create({ user, farmId, body }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios visibles para el rol actual' })
  async list(@CurrentUser() user: AuthUser) {
    return unwrapServiceResult(await this.usersService.list(user));
  }

  @Patch(':id')
  @UseGuards(LoadUserFarmsGuard)
  @ApiOperation({
    summary: 'Editar usuario',
    description: 'Enviar `activo: false` elimina la cuenta (borrado lógico).',
  })
  @ApiJsonBody({
    nombre: 'string',
    password: 'string',
    activo: 'boolean',
    granja_ids: 'integer[]',
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Headers('x-farm-id') farmIdHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const farmId = Number(farmIdHeader) || undefined;
    return unwrapServiceResult(
      await this.usersService.update({
        user,
        farmId,
        id: Number(id),
        body,
      }),
    );
  }
}
