/** Domain port (repository abstraction). */
export abstract class WeaningsRepositoryPort {
  protected constructor() {}
  abstract createDestete(...args: any[]): Promise<any> | any;
  abstract findParto(...args: any[]): Promise<any> | any;
  abstract listDestetes(...args: any[]): Promise<any> | any;
}
