/** Domain port (repository abstraction). */
export abstract class MovementsRepositoryPort {
  protected constructor() {}
  abstract animalesActualesJaula(...args: any[]): Promise<any> | any;
  abstract animalesEnFecha(...args: any[]): Promise<any> | any;
  abstract codigoExisteEnGranja(...args: any[]): Promise<any> | any;
  abstract ejecutarTransferencia(...args: any[]): Promise<any> | any;
  abstract ejecutarTraslado(...args: any[]): Promise<any> | any;
  abstract findJaulaEnGranja(...args: any[]): Promise<any> | any;
  abstract getAnimalesActivos(...args: any[]): Promise<any> | any;
  abstract getAnimalesFromJaula(...args: any[]): Promise<any> | any;
  abstract getAnimalesTransferencia(...args: any[]): Promise<any> | any;
  abstract getGranjaActiva(...args: any[]): Promise<any> | any;
  abstract getGranjaEspecie(...args: any[]): Promise<any> | any;
  abstract getJaula(...args: any[]): Promise<any> | any;
  abstract historialAnimal(...args: any[]): Promise<any> | any;
  abstract historialJaula(...args: any[]): Promise<any> | any;
  abstract listAnimalesConArea(...args: any[]): Promise<any> | any;
  abstract listJaulasDestino(...args: any[]): Promise<any> | any;
  abstract listRecientes(...args: any[]): Promise<any> | any;
  abstract listSobrecupo(...args: any[]): Promise<any> | any;
}
