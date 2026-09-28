import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../shared/guards/load-user-farms.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { AuthUser } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { USERS_SERVICE } from './platform.tokens';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class UsersController {
  constructor(@Inject(USERS_SERVICE) private readonly usersService: any) {}

  @Post()
  @UseGuards(LoadUserFarmsGuard)
  async create(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const farmId = Number(req.headers['x-farm-id']) || undefined;
    return unwrapServiceResult(
      await this.usersService.create({ user, farmId, body }),
    );
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return unwrapServiceResult(this.usersService.list(user));
  }

  @Patch(':id')
  @UseGuards(LoadUserFarmsGuard)
  async update(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const farmId = Number(req.headers['x-farm-id']) || undefined;
    return unwrapServiceResult(
      await this.usersService.update({
        user,
        farmId,
        id: Number(id),
        body,
      }),
    );
  }
}
