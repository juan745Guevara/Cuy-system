/** Domain port (repository abstraction). */
export abstract class RecintosRepositoryPort {
  protected constructor() {}
  abstract deactivate(...args: any[]): Promise<any> | any;
  abstract findAreaInFarm(...args: any[]): Promise<any> | any;
  abstract findDuplicateCode(...args: any[]): Promise<any> | any;
  abstract findInFarm(...args: any[]): Promise<any> | any;
  abstract insert(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract listAnimals(...args: any[]): Promise<any> | any;
  abstract occupancyRows(...args: any[]): Promise<any> | any;
  abstract update(...args: any[]): Promise<any> | any;
}
