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
import { BIRTHS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Partos')
@Controller('cuyes/births')
@FarmScope()
export class BirthsController {
  constructor(@Inject(BIRTHS_SERVICE) private readonly service: any) {}

  @Get()
  @ApiOperation({ summary: 'Listar partos' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar parto' })
  @ApiJsonBody(
    {
      id_hembra: 'integer',
      id_empadre: 'integer',
      fecha_parto: 'date',
      vivos_m: 'integer',
      vivos_h: 'integer',
      muertos: 'integer',
      peso_m1: 'number',
      peso_m2: 'number',
      peso_m3: 'number',
      peso_h1: 'number',
      peso_h2: 'number',
      peso_h3: 'number',
    },
    ['id_hembra', 'fecha_parto'],
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
