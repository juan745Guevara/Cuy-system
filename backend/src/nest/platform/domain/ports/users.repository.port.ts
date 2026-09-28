/** Domain port (repository abstraction). */
export abstract class UsersRepositoryPort {
  protected constructor() {}
  abstract createWithFarms(...args: any[]): Promise<any> | any;
  abstract findActiveFarmIds(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract findFarmIdsByUser(...args: any[]): Promise<any> | any;
  abstract findWithFarms(...args: any[]): Promise<any> | any;
  abstract listVisible(...args: any[]): Promise<any> | any;
  abstract logBlockedEscalation(...args: any[]): Promise<any> | any;
  abstract updateWithFarms(...args: any[]): Promise<any> | any;
}
