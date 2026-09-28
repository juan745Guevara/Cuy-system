/** Domain port (repository abstraction). */
export abstract class BirthsRepositoryPort {
  protected constructor() {}
  abstract createParto(...args: any[]): Promise<any> | any;
  abstract findHembraActiva(...args: any[]): Promise<any> | any;
  abstract listPartos(...args: any[]): Promise<any> | any;
}
