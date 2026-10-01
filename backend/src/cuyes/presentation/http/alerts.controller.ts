import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
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
import { ALERTS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Alertas')
@Controller('cuyes/alerts')
@FarmScope()
export class AlertsController {
  constructor(@Inject(ALERTS_SERVICE) private readonly service: any) {}

  @Get('config')
  @ApiOperation({ summary: 'Configuración de plazos de alertas' })
  async getConfig(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getConfig(farmId));
  }

  @Get()
  @ApiOperation({ summary: 'Alertas activas de la granja' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({
    summary: 'Guardar configuración de alertas',
    description: 'Acepta `{ items: [...] }` o directamente un arreglo de configuraciones.',
  })
  @ApiJsonBody({ items: 'object[]' }, ['items'])
  async updateConfig(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.updateConfig({ farmId, userId: user.id, body }),
    );
  }

  @Post('discard')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar')
  @ApiOperation({ summary: 'Descartar una alerta' })
  @ApiJsonBody(
    { tipo: 'string', id_animal: 'integer', id_referencia: 'integer', motivo: 'string' },
    ['tipo'],
  )
  async discard(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.discard({ farmId, userId: user.id, body }),
    );
  }
}
