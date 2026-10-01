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
import { WEANINGS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Destetes')
@Controller('cuyes/weanings')
@FarmScope()
export class WeaningsController {
  constructor(@Inject(WEANINGS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar destetes' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar destete de un parto' })
  @ApiJsonBody(
    {
      id_parto: 'integer',
      fecha_destete: 'date',
      destetados_m: 'integer',
      destetados_h: 'integer',
      muertos: 'integer',
      peso_m1: 'number',
      peso_m2: 'number',
      peso_m3: 'number',
      peso_h1: 'number',
      peso_h2: 'number',
      peso_h3: 'number',
      id_jaula_m: 'integer',
      id_jaula_h: 'integer',
    },
    ['id_parto', 'fecha_destete'],
  )
  async register(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.register({ farmId, userId: user.id, body }),
    );
  }
}
