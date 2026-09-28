/** Domain port (repository abstraction). */
export abstract class AnimalsRepositoryPort {
  protected constructor() {}
  abstract findByCodigoNorm(...args: any[]): Promise<any> | any;
  abstract findByCodigoNormRaw(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract findJaulaActiva(...args: any[]): Promise<any> | any;
  abstract getHistorial(...args: any[]): Promise<any> | any;
  abstract getTratamientos(...args: any[]): Promise<any> | any;
  abstract insertNuevo(...args: any[]): Promise<any> | any;
  abstract insertParticularidad(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract reusarBaja(...args: any[]): Promise<any> | any;
  abstract update(...args: any[]): Promise<any> | any;
}
