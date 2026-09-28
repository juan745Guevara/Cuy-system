/** Domain port (repository abstraction). */
export abstract class MortalityRepositoryPort {
  protected constructor() {}
  abstract countPoblacion(...args: any[]): Promise<any> | any;
  abstract create(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
}
