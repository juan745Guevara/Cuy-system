/** Domain port (repository abstraction). */
export abstract class AuthRepositoryPort {
  protected constructor() {}
  abstract findFarmsForSuperadmin(...args: any[]): Promise<any> | any;
  abstract findFarmsForUser(...args: any[]): Promise<any> | any;
  abstract findUserByEmail(...args: any[]): Promise<any> | any;
  abstract logLogin(...args: any[]): Promise<any> | any;
  abstract logLogout(...args: any[]): Promise<any> | any;
}
