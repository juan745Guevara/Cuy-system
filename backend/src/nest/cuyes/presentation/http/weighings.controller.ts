import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { WEIGHINGS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/weighings')
@FarmScope()
export class WeighingsController {
  constructor(@Inject(WEIGHINGS_SERVICE) private readonly service: any) {}

  @Get('ranges')
  async getRanges(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getRanges(farmId));
  }

  @Get('average')
  async getAverage(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return unwrapServiceResult(
      await this.service.getAverage({ farmId, query }),
    );
  }

  @Get('animal/:id_animal')
  async animalTrend(
    @FarmId() farmId: number,
    @Param('id_animal') animalId: string,
  ) {
    return unwrapServiceResult(
      await this.service.animalTrend({ farmId, animalId }),
    );
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor')
  async createBatch(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBatch({ farmId, userId: user.id, body }),
    );
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
      await this.service.create({ farmId, userId: user.id, body }),
    );
  }

  @Put('ranges')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado')
  async updateRanges(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.updateRangos({
        farmId,
        userId: user.id,
        body: body || {},
      }),
    );
  }
}
