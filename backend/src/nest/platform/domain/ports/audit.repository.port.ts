/** Domain port (repository abstraction). */
export abstract class AuditRepositoryPort {
  protected constructor() {}
  abstract ensureMortalidadAnulacionColumns(...args: any[]): Promise<any> | any;
  abstract ensureVentasAnulacionColumns(...args: any[]): Promise<any> | any;
  abstract findMortalidad(...args: any[]): Promise<any> | any;
  abstract findVenta(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract voidMortality(...args: any[]): Promise<any> | any;
  abstract voidSale(...args: any[]): Promise<any> | any;
}
