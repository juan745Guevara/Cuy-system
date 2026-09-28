import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { FarmId } from '../shared/decorators/farm-id.decorator';
import { AuthUser } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { CuyesFarmScope } from './cuyes-scope.decorator';
import { BIRTHS_SERVICE } from './cuyes.tokens';

@Controller('cuyes/births')
@CuyesFarmScope()
export class BirthsController {
  constructor(@Inject(BIRTHS_SERVICE) private readonly service: any) {}

  @Get()
  list(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.list(farmId));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async register(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.register({ farmId, userId: user.id, body }),
    );
  }
}
