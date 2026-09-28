import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { AuthUser } from '../../../shared/auth/auth-user.types';
import { sendExportResponse } from '../../../shared/http/service-result';
import { CuyesFarmScope } from '../cuyes-scope.decorator';
import { REPORTS_SERVICE } from '../../cuyes.tokens';

@Controller('cuyes/reports')
@CuyesFarmScope()
export class ReportsController {
  constructor(@Inject(REPORTS_SERVICE) private readonly service: any) {}

  @Get('females')
  async exportFemales(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    sendExportResponse(
      res,
      await this.service.exportFemales({ farmId, query }),
    );
  }

  @Get('males')
  async exportMales(@FarmId() farmId: number, @Res() res: Response) {
    sendExportResponse(res, await this.service.exportMales(farmId));
  }

  @Get('monthly-inventory')
  async exportMonthlyInventory(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    sendExportResponse(
      res,
      await this.service.exportMonthlyInventory({ farmId, query }),
    );
  }

  @Get('animals')
  async exportAnimals(
    @FarmId() farmId: number,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    sendExportResponse(
      res,
      await this.service.exportAnimals({ farmId, query }),
    );
  }

  @Get('consolidated')
  async exportConsolidated(
    @CurrentUser() user: AuthUser,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    sendExportResponse(
      res,
      await this.service.exportConsolidated({ user, query }),
    );
  }
}
