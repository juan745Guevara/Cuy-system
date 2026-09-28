/** Domain port (repository abstraction). */
export abstract class SalesRepositoryPort {
  protected constructor() {}
  abstract countPopulation(...args: any[]): Promise<any> | any;
  abstract create(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract listDiscards(...args: any[]): Promise<any> | any;
  abstract sellDiscards(...args: any[]): Promise<any> | any;
}
