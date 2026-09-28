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
import { SpeciesName } from '../../../shared/decorators/species-name.decorator';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { AREAS_SERVICE } from '../../platform.tokens';

@Controller('areas')
@FarmScope()
export class AreasController {
  constructor(@Inject(AREAS_SERVICE) private readonly service: any) {}

  @Get()
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Get('summary')
  async summary(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getSummary(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  async create(
    @FarmId() farmId: number,
    @SpeciesName() speciesNombre: string | undefined,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({ farmId, userId: user.id, speciesNombre, body }),
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
