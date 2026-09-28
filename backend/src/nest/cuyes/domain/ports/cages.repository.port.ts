/** Domain port (repository abstraction). */
export abstract class CagesRepositoryPort {
  protected constructor() {}
  abstract deactivate(...args: any[]): Promise<any> | any;
  abstract findAreaInGranja(...args: any[]): Promise<any> | any;
  abstract findDuplicateCodigo(...args: any[]): Promise<any> | any;
  abstract findInGranja(...args: any[]): Promise<any> | any;
  abstract insert(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract listAnimales(...args: any[]): Promise<any> | any;
  abstract ocupacionRows(...args: any[]): Promise<any> | any;
  abstract update(...args: any[]): Promise<any> | any;
}
