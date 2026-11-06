/** Domain port (repository abstraction). */
export abstract class AuditRepositoryPort {
  protected constructor() {}
  abstract findMortality(...args: any[]): Promise<any> | any;
  abstract findSale(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract voidMortality(...args: any[]): Promise<any> | any;
  abstract voidSale(...args: any[]): Promise<any> | any;
}
