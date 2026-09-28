import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../../../shared/guards/load-user-farms.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UserFarms } from '../../../shared/decorators/user-farms.decorator';
import { AuthUser, UserFarm } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { SPECIES_SERVICE } from '../../platform.tokens';

@Controller('species')
@UseGuards(JwtAuthGuard, LoadUserFarmsGuard)
export class SpeciesController {
  constructor(@Inject(SPECIES_SERVICE) private readonly speciesService: any) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @UserFarms() userFarms: UserFarm[]) {
    if (user.rol === 'superadmin') {
      return unwrapServiceResult(await this.speciesService.list());
    }
    return unwrapServiceResult(this.speciesService.listForUser(userFarms));
  }
}
