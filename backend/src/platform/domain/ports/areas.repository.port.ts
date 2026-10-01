/** Domain port (repository abstraction). */
export abstract class AreasRepositoryPort {
  protected constructor() {}
  abstract createWithCages(...args: any[]): Promise<any> | any;
  abstract deactivate(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract findByName(...args: any[]): Promise<any> | any;
  abstract findTakenCages(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract summary(...args: any[]): Promise<any> | any;
  abstract updateWithCages(...args: any[]): Promise<any> | any;
}
