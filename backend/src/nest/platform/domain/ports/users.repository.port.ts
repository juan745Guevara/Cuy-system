/** Domain port (repository abstraction). */
export abstract class UsersRepositoryPort {
  protected constructor() {}
  abstract createWithGranjas(...args: any[]): Promise<any> | any;
  abstract findActiveFarmIds(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract findFarmIdsByUser(...args: any[]): Promise<any> | any;
  abstract findWithGranjas(...args: any[]): Promise<any> | any;
  abstract listVisible(...args: any[]): Promise<any> | any;
  abstract logEscaladaBloqueada(...args: any[]): Promise<any> | any;
  abstract updateWithGranjas(...args: any[]): Promise<any> | any;
}
