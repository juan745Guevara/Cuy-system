/** Domain port (repository abstraction). */
export abstract class SpeciesRepositoryPort {
  protected constructor() {}
  abstract listActive(...args: any[]): Promise<any> | any;
}
