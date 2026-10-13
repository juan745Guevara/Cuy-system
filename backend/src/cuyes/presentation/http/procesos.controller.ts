import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FarmId } from '../../../shared/decorators/farm-id.decorator';
import { FarmScope } from '../../../shared/decorators/farm-scope.decorator';
import { unwrapServiceResult } from '../../../shared/http/service-result';
import { PROCESOS_SERVICE } from '../../cuyes.tokens';

@ApiTags('Cuyes · Procesos BPMN')
@Controller('cuyes/procesos')
@FarmScope()
export class ProcesosController {
  constructor(@Inject(PROCESOS_SERVICE) private readonly service: any) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'Resumen por fase del flujo BPMN (Crianza → Reproducción → Ventas)',
  })
  async resumen(@FarmId() farmId: number) {
    return unwrapServiceResult(await this.service.resumen(farmId));
  }
}
