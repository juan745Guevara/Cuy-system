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
import { SALES_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Ventas')
@Controller('cuyes/sales')
@FarmScope()
export class SalesController {
  constructor(@Inject(SALES_SERVICE) private readonly service: any) {}

  @Get('discards')
  @ApiOperation({ summary: 'Animales marcados para descarte (vendibles)' })
  async listDiscards(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.listDiscards(farmId));
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post('discards')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Vender animales de descarte' })
  @ApiJsonBody(
    { fecha: 'date', id_animales: 'integer[]', comprador: 'string', precio: 'number' },
    ['fecha', 'id_animales'],
  )
  async sellDiscards(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.sellDiscards({ farmId, userId: user.id, body }),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar venta (individual o por lote)' })
  @ApiJsonBody(
    {
      fecha: 'date',
      cantidad: 'integer',
      id_animal: 'integer',
      clasificacion: 'string',
      categoria: 'string',
      comprador: 'string',
      precio: 'number',
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
