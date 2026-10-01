import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Salud')
@Controller()
export class HealthController {
  @Get('api/health')
  health() {
    return { status: 'ok', message: 'Animal Control System - UNAS' };
  }
}
