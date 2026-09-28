import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../shared/guards/load-user-farms.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { UserFarms } from '../shared/decorators/user-farms.decorator';
import { AuthUser, UserFarm } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { AUTH_SERVICE } from './platform.tokens';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: any) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  async login(@Body() body: { email?: string; password?: string }) {
    return unwrapServiceResult(await this.authService.login(body || {}));
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthUser) {
    return unwrapServiceResult(await this.authService.logout(user.id));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, LoadUserFarmsGuard)
  me(@CurrentUser() user: AuthUser, @UserFarms() granjas: UserFarm[]) {
    return unwrapServiceResult(this.authService.me({ user, granjas }));
  }
}
