import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { CuyesFarmScope } from '../cuyes-scope.decorator';
import { AREAS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/areas')
@CuyesFarmScope()
export class AreasController {
  constructor(@Inject(AREAS_SERVICE) private readonly service: any) {}

  @Get()
  list(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.list(farmId));
  }

  @Get('summary')
  summary(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getSummary(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  async create(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({ farmId, userId: user.id, body }),
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  async deactivate(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.deactivate({
        farmId,
        userId: user.id,
        id: Number(id),
        body,
      }),
    );
  }
}
