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
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { RANKING_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/ranking')
@FarmScope()
export class RankingController {
  constructor(@Inject(RANKING_SERVICE) private readonly service: any) {}

  @Get('config')
  async getConfig(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getConfig(farmId));
  }

  @Get()
  async list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(await this.service.list({ farmId, query }));
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
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
