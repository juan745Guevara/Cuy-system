/** Domain port (repository abstraction). */
export abstract class BirthsRepositoryPort {
  protected constructor() {}
  abstract createBirth(...args: any[]): Promise<any> | any;
  abstract findActiveFemale(...args: any[]): Promise<any> | any;
  abstract listBirths(...args: any[]): Promise<any> | any;
}
