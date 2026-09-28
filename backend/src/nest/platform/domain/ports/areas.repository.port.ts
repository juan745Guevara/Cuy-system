/** Domain port (repository abstraction). */
export abstract class AreasRepositoryPort {
  protected constructor() {}
  abstract countActiveJaulas(...args: any[]): Promise<any> | any;
  abstract createWithJaulas(...args: any[]): Promise<any> | any;
  abstract deactivate(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract resumen(...args: any[]): Promise<any> | any;
}
