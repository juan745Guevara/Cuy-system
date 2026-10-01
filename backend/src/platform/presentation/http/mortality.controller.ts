import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
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
import { MORTALITY_SERVICE } from '../../platform.tokens';

@ApiTags('Mortalidad')
@Controller('mortality')
@FarmScope()
export class MortalityController {
  constructor(@Inject(MORTALITY_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de mortalidad' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar mortalidad (individual o por lote)' })
  @ApiJsonBody(
    {
      fecha: 'date',
      cantidad: 'integer',
      id_animal: 'integer',
      clasificacion: 'string',
      categoria: 'string',
      causa: 'string',
      id_jaula: 'integer',
    },
    ['fecha', 'cantidad'],
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
}
