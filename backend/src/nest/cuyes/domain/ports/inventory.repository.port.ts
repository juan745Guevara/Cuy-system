/** Domain port (repository abstraction). */
export abstract class InventoryRepositoryPort {
  protected constructor() {}
  abstract consolidatedFarms(...args: any[]): Promise<any> | any;
  abstract activeDetail(...args: any[]): Promise<any> | any;
  abstract mortalityInPeriod(...args: any[]): Promise<any> | any;
  abstract birthsInPeriod(...args: any[]): Promise<any> | any;
  abstract populationAt(...args: any[]): Promise<any> | any;
  abstract byArea(...args: any[]): Promise<any> | any;
  abstract byCategoryArea(...args: any[]): Promise<any> | any;
  abstract transfersInPeriod(...args: any[]): Promise<any> | any;
  abstract salesInPeriod(...args: any[]): Promise<any> | any;
}
