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
import { ANIMALS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Animales')
@Controller('cuyes/animals')
@FarmScope()
export class AnimalsController {
  constructor(@Inject(ANIMALS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar animales (filtros por query string)' })
  async list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(await this.service.list({ farmId, query }));
  }

  @Get('buscar/:codigo')
  @ApiOperation({ summary: 'Buscar animal por código' })
  async findByCode(@FarmId() farmId: number, @Param('codigo') codigo: string) {
    return unwrapServiceResult(
      await this.service.findByCode({ farmId, codigoRaw: codigo }),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar animal' })
  @ApiJsonBody(
    {
      codigo: 'string',
      sexo: { type: 'string', enum: ['M', 'H'] },
      id_jaula: 'integer',
      id_raza: 'integer',
      id_categoria: 'integer',
      fecha_nacimiento: 'date',
      particularidad: 'string',
      confirmar_capacidad: { type: 'boolean', description: 'Permitir sobrepasar capacidad de la jaula' },
      confirmar_reuso: { type: 'boolean', description: 'Reutilizar el código de un animal dado de baja' },
    },
    ['codigo', 'sexo', 'id_jaula'],
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Editar o dar de baja un animal' })
  @ApiJsonBody({
    estado: { type: 'string', description: "'activo' o el estado de baja" },
    motivo_baja: 'string',
    fecha_baja: 'date',
    id_categoria: 'integer',
    id_jaula: 'integer',
    particularidad: 'string',
  })
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
