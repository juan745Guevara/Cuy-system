import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { FarmId } from '../shared/decorators/farm-id.decorator';
import { AuthUser } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { CuyesFarmScope } from './cuyes-scope.decorator';
import { ALERTS_SERVICE } from './cuyes.tokens';

@Controller('cuyes/alerts')
@CuyesFarmScope()
export class AlertsController {
  constructor(@Inject(ALERTS_SERVICE) private readonly service: any) {}

  @Get('config')
  getConfig(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getConfig(farmId));
  }

  @Get()
  list(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.list(farmId));
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

  @Post('discard')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar')
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
