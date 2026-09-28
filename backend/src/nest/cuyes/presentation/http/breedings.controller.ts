import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { BREEDINGS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/breedings')
@FarmScope()
export class BreedingsController {
  constructor(@Inject(BREEDINGS_SERVICE) private readonly service: any) {}

  @Get('breeding-females/:id')
  async femaleProfile(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getFemaleBreedingProfile({
        farmId,
        hembraId: Number(id),
      }),
    );
  }

  @Get('breeding-males/:id')
  async maleProfile(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getMaleBreedingProfile({ farmId, machoId: id }),
    );
  }

  @Get('cage/:id/females')
  async femalesInCage(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getFemalesInCage({ farmId, jaulaId: id }),
    );
  }

  @Get()
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post('breeding-females')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async createBreedingFemale(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBreedingFemale({
        farmId,
        userId: user.id,
        body,
      }),
    );
  }

  @Post('breeding-males')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async createBreedingMale(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBreedingMale({
        farmId,
        userId: user.id,
        body,
      }),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async createBreeding(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBreeding({ farmId, userId: user.id, body }),
    );
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async closeBreeding(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') empadreId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.closeBreeding({
        farmId,
        userId: user.id,
        empadreId,
        body,
      }),
    );
  }

  @Patch(':id/females/:femaleId')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  async updateFemaleResult(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') empadreId: string,
    @Param('femaleId') hembraId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.updateFemaleBreedingResult({
        farmId,
        userId: user.id,
        empadreId,
        hembraId,
        body,
      }),
    );
  }
}
