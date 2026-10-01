import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { exportToStreamableFile } from '../../../shared/http/service-result';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { REPORTS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Reportes')
@ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
@Controller('cuyes/reports')
@FarmScope()
export class ReportsController {
  constructor(@Inject(REPORTS_SERVICE) private readonly service: any) {}

  @Get('females')
  @ApiOperation({ summary: 'Exportar hembras reproductoras (Excel)' })
  async exportFemales(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return exportToStreamableFile(
      await this.service.exportFemales({ farmId, query }),
    );
  }

  @Get('males')
  @ApiOperation({ summary: 'Exportar machos reproductores (Excel)' })
  async exportMales(@FarmId() farmId: number) {
    return exportToStreamableFile(await this.service.exportMales(farmId));
  }

  @Get('monthly-inventory')
  @ApiOperation({ summary: 'Exportar inventario mensual (Excel)' })
  async exportMonthlyInventory(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return exportToStreamableFile(
      await this.service.exportMonthlyInventory({ farmId, query }),
    );
  }

  @Get('animals')
  @ApiOperation({ summary: 'Exportar animales (Excel)' })
  async exportAnimals(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
  ) {
    return exportToStreamableFile(
      await this.service.exportAnimals({ farmId, query }),
    );
  }

  @Get('consolidated')
  @ApiOperation({ summary: 'Exportar consolidado multigranja (Excel)' })
  async exportConsolidated(
    @CurrentUser() user: AuthUser,
    @Query() query: Record<string, string>,
  ) {
    return exportToStreamableFile(
      await this.service.exportConsolidated({ user, query }),
    );
  }
}
