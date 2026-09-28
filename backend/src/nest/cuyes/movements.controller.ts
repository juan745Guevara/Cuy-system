import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { UserFarms } from '../shared/decorators/user-farms.decorator';
import { FarmId } from '../shared/decorators/farm-id.decorator';
import { AuthUser, UserFarm } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { CuyesFarmScope } from './cuyes-scope.decorator';
import { MOVEMENTS_SERVICE } from './cuyes.tokens';

@Controller('cuyes/movements')
@CuyesFarmScope()
export class MovementsController {
  constructor(@Inject(MOVEMENTS_SERVICE) private readonly service: any) {}

  @Get()
  list(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.list(farmId));
  }

  @Get('overcapacity')
  overcapacity(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.listOvercapacity(farmId));
  }

  @Get('out-of-area')
  outOfArea(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.listOutOfArea(farmId));
  }

  @Get('destination-cages/:farm_id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  destinationCages(
    @FarmId() farmId: number,
    @Param('farm_id') farmIdDestino: string,
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
  ) {
    return unwrapServiceResult(
      this.service.destinationCages({
        farmId,
        farmIdDestino,
        user,
        userFarms,
      }),
    );
  }

  @Get('animal/:id_animal')
  animalHistory(
    @FarmId() farmId: number,
    @Param('id_animal') animalId: string,
  ) {
    return unwrapServiceResult(
      this.service.animalHistory({ farmId, animalId }),
    );
  }

  @Get('cage/:cage_id')
  cageHistory(
    @FarmId() farmId: number,
    @Param('cage_id') cageId: string,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      this.service.cageHistory({
        farmId,
        jaulaId: Number(cageId),
        query,
      }),
    );
  }

  @Post('relocate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  async relocate(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.relocate({ farmId, userId: user.id, body }),
    );
  }

  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'supervisor')
  async transfer(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.transfer({
        farmId,
        userId: user.id,
        user,
        userFarms,
        body,
      }),
    );
  }
}
