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
import { TREATMENTS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/treatments')
@CuyesFarmScope()
export class TreatmentsController {
  constructor(@Inject(TREATMENTS_SERVICE) private readonly service: any) {}

  @Get('in-progress')
  listActive(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      this.service.listActive({ farmId, query }),
    );
  }

  @Get()
  list(@FarmId() farmId: number, @Query() query: Record<string, string>) {
    return unwrapServiceResult(this.service.list({ farmId, query }));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  async create(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.create({
        farmId,
        userId: user.id,
        user,
        body,
      }),
    );
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  async complete(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.complete({
        farmId,
        userId: user.id,
        id,
        body,
      }),
    );
  }
}
