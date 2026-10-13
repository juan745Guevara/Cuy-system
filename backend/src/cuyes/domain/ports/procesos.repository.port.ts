/** Domain port (repository abstraction). */
export abstract class ProcesosRepositoryPort {
  protected constructor() {}
  abstract resumenFases(...args: any[]): Promise<any> | any;
}
