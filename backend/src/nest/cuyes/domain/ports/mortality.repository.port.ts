/** Domain port (repository abstraction). */
export abstract class MortalityRepositoryPort {
  protected constructor() {}
  abstract countPopulation(...args: any[]): Promise<any> | any;
  abstract create(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
}
