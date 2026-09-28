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
import { CuyesFarmScope } from '../cuyes-scope.decorator';
import { CATALOGS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/catalogs')
@CuyesFarmScope()
export class CatalogsController {
  constructor(@Inject(CATALOGS_SERVICE) private readonly service: any) {}

  @Get('breeds')
  listBreeds(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.listBreeds(farmId));
  }

  @Post('breeds')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  async createBreed(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createBreed({ farmId, userId: user.id, body }),
    );
  }

  @Get('categories')
  listCategories(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.listCategories(farmId));
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  async createCategory(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapServiceResult(
      await this.service.createCategory({ farmId, userId: user.id, body }),
    );
  }

  @Patch('breeds/:id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  async deactivateBreed(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return unwrapServiceResult(
      await this.service.deactivateRaza({ farmId, userId: user.id, id }),
    );
  }

  @Patch('categories/:id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  async deactivateCategory(
    @FarmId() farmId: number,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return unwrapServiceResult(
      await this.service.deactivateCategoria({ farmId, userId: user.id, id }),
    );
  }

  @Get('transitions')
  transitions(@FarmId() farmId: number) {
    return unwrapServiceResult(this.service.getTransitions(farmId));
  }
}
