/** Domain port (repository abstraction). */
export abstract class WeaningsRepositoryPort {
  protected constructor() {}
  abstract createWeaning(...args: any[]): Promise<any> | any;
  abstract findBirth(...args: any[]): Promise<any> | any;
  abstract listWeanings(...args: any[]): Promise<any> | any;
}
