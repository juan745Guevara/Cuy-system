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
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoadUserFarmsGuard } from '../shared/guards/load-user-farms.guard';
import { FarmAccessGuard } from '../shared/guards/farm-access.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { FarmId } from '../shared/decorators/farm-id.decorator';
import { AuthUser } from '../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../shared/http/service-result';
import { AUDIT_SERVICE } from './platform.tokens';

@Controller('audit')
@UseGuards(JwtAuthGuard, LoadUserFarmsGuard, FarmAccessGuard, RolesGuard)
@Roles('superadmin', 'admin', 'supervisor', 'encargado')
export class AuditController {
  constructor(@Inject(AUDIT_SERVICE) private readonly auditService: any) {}

  @Get()
  list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(this.auditService.list(farmId, query));
  }

  @Post('void/mortality/:id')
  async voidMortality(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.auditService.voidMortality({
        farmId,
        userId: user.id,
        id,
        body,
      }),
    );
  }

  @Post('void/sale/:id')
  async voidSale(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.auditService.voidSale({
        farmId,
        userId: user.id,
        id,
        body,
      }),
    );
  }
}
