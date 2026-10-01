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
import { BREEDINGS_SERVICE } from '../../cuyes.tokens';

const BREEDER_BODY = ApiJsonBody(
  {
    codigo: 'string',
    id_jaula: 'integer',
    id_raza: 'integer',
    id_categoria: 'integer',
    fecha_nacimiento: 'date',
    particularidad: 'string',
  },
  ['codigo', 'id_jaula'],
);

@ApiTags('Cuyes · Empadres')
@Controller('cuyes/breedings')
@FarmScope()
export class BreedingsController {
  constructor(@Inject(BREEDINGS_SERVICE) private readonly service: any) {}

  @Get('breeding-females/:id')
  @ApiOperation({ summary: 'Perfil reproductivo de una hembra' })
  async femaleProfile(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getFemaleBreedingProfile({
        farmId,
        hembraId: Number(id),
      }),
    );
  }

  @Get('breeding-males/:id')
  @ApiOperation({ summary: 'Perfil reproductivo de un macho' })
  async maleProfile(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getMaleBreedingProfile({ farmId, machoId: id }),
    );
  }

  @Get('cage/:id/females')
  @ApiOperation({ summary: 'Hembras disponibles en una jaula' })
  async femalesInCage(@FarmId() farmId: number, @Param('id') id: string) {
    return unwrapServiceResult(
      await this.service.getFemalesInCage({ farmId, jaulaId: id }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar empadres' })
  async list(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.list(farmId));
  }

  @Post('breeding-females')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin', 'encargado', 'auxiliar')
  @ApiOperation({ summary: 'Registrar hembra reproductora' })
  @BREEDER_BODY
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
  @ApiOperation({ summary: 'Registrar macho reproductor' })
  @BREEDER_BODY
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
  @ApiOperation({ summary: 'Crear empadre' })
  @ApiJsonBody(
    {
      id_macho: 'integer',
      hembras: { type: 'integer[]', description: 'IDs de las hembras' },
      id_jaula: 'integer',
      fecha_empadre: 'date',
      peso_antes: 'number',
      peso_despues: 'number',
      cantidad_prenadas: 'integer',
      notas: 'string',
    },
    ['fecha_empadre', 'hembras'],
  )
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
  @ApiOperation({ summary: 'Cerrar empadre y devolver el macho a una jaula' })
  @ApiJsonBody({ id_jaula_retorno: 'integer' }, ['id_jaula_retorno'])
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
  @ApiOperation({ summary: 'Registrar resultado de una hembra en el empadre' })
  @ApiJsonBody({ resultado: 'string', fecha: 'date' }, ['resultado'])
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
