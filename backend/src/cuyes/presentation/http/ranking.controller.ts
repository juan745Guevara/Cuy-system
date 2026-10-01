import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
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
import { RANKING_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Ranking')
@Controller('cuyes/ranking')
@FarmScope()
export class RankingController {
  constructor(@Inject(RANKING_SERVICE) private readonly service: any) {}

  @Get('config')
  @ApiOperation({ summary: 'Pesos de los criterios del ranking' })
  async getConfig(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getConfig(farmId));
  }

  @Get()
  @ApiOperation({ summary: 'Ranking de reproductores' })
  async list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(await this.service.list({ farmId, query }));
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Actualizar pesos de los criterios del ranking' })
  @ApiJsonBody({
    peso_partos: { type: 'number', example: 20 },
    peso_camada: { type: 'number', example: 25 },
    peso_destete: { type: 'number', example: 20 },
    peso_mortalidad: { type: 'number', example: 15 },
    peso_peso_nac: { type: 'number', example: 10 },
    peso_peso_dest: { type: 'number', example: 10 },
    peso_prenez_macho: { type: 'number', example: 30 },
  })
  async updateConfig(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.updateConfig({ farmId, userId: user.id, body }),
    );
  }

  @Post(':id_animal/mark')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'supervisor')
  @ApiOperation({ summary: 'Marcar un reproductor para descarte o reemplazo' })
  @ApiJsonBody(
    { accion: { type: 'string', enum: ['descarte', 'reemplazo'] } },
    ['accion'],
  )
  async mark(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id_animal') animalId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.mark({
        farmId,
        userId: user.id,
        animalId,
        body,
      }),
    );
  }
}
