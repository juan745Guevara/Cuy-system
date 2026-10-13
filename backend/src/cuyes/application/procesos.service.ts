import { Injectable } from '@nestjs/common';
import { ok, fromError } from '../../shared/kernel/service-result.kernel';
import { ProcesosRepositoryPort } from '../domain/ports/procesos.repository.port';

@Injectable()
export class ProcesosService {
  constructor(private readonly repository: ProcesosRepositoryPort) {}

  async resumen(farmId: number) {
    try {
      return ok(await this.repository.resumenFases(farmId));
    } catch (err) {
      return fromError(err);
    }
  }
}
