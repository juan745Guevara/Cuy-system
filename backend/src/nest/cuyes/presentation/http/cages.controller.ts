import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { CuyesFarmScope } from '../cuyes-scope.decorator';
import { CAGES_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/cages')
@CuyesFarmScope()
export class CagesController {
  constructor(@Inject(CAGES_SERVICE) private readonly service: any) {}

  @Get()
  list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(this.service.list({ farmId, query }));
  }

  @Get('occupancy')
  occupancy(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getOccupancy(farmId));
  }

  @Get(':id/animales')
  animals(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      this.service.getAnimals({ farmId, jaulaId: id }),
    );
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
  ) {
    return unwrapServiceResult(
      await this.service.deactivate({
        farmId,
        userId: user.id,
        id: Number(id),
      }),
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  async update(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.update({
        farmId,
        userId: user.id,
        id: Number(id),
        body,
      }),
    );
  }
}
