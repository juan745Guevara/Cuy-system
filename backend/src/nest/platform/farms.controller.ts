import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../shared/guards/load-user-farms.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { UserFarms } from '../shared/decorators/user-farms.decorator';
import { AuthUser, UserFarm } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { FARMS_SERVICE } from './platform.tokens';

@Controller('farms')
export class FarmsController {
  constructor(@Inject(FARMS_SERVICE) private readonly farmsService: any) {}

  @Get()
  @UseGuards(JwtAuthGuard, LoadUserFarmsGuard)
  list(@UserFarms() userFarms: UserFarm[]) {
    return unwrapServiceResult(this.farmsService.list(userFarms));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return unwrapServiceResult(
      await this.farmsService.create({
        userId: user.id,
        farmId: undefined,
        body,
      }),
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.farmsService.deactivate({
        userId: user.id,
        farmId: undefined,
        id: Number(id),
      }),
    );
  }

  @Put(':id/users')
  @UseGuards(JwtAuthGuard, LoadUserFarmsGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  async assignUsers(
    @CurrentUser() user: AuthUser,
    @UserFarms() userFarms: UserFarm[],
    @Param('id') id: string,
    @Body() body: { usuario_ids?: number[] },
  ) {
    return unwrapServiceResult(
      await this.farmsService.assignUsers({
        userId: user.id,
        userRol: user.rol,
        userFarms,
        farmId: Number(id),
        usuario_ids: body?.usuario_ids,
      }),
    );
  }
}
