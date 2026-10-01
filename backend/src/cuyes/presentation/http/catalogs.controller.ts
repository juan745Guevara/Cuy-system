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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiJsonBody } from '../../../shared/http/api-json-body.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { CATALOGS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Catálogos')
@Controller('cuyes/catalogs')
@FarmScope()
export class CatalogsController {
  constructor(@Inject(CATALOGS_SERVICE) private readonly service: any) {}

  @Get('breeds')
  @ApiOperation({ summary: 'Listar razas' })
  async listBreeds(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.listBreeds(farmId));
  }

  @Post('breeds')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Crear raza' })
  @ApiJsonBody({ nombre: 'string' }, ['nombre'])
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
  @ApiOperation({ summary: 'Listar categorías' })
  async listCategories(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.listCategories(farmId));
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiJsonBody({ nombre: 'string', proposito_area: 'string' }, ['nombre'])
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
  @ApiOperation({ summary: 'Desactivar raza' })
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
  @ApiOperation({ summary: 'Desactivar categoría' })
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
  @ApiOperation({ summary: 'Transiciones de categoría permitidas' })
  async transitions(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.getTransitions(farmId));
  }
}
