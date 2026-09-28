/** Domain port (repository abstraction). */
export abstract class InventoryRepositoryPort {
  protected constructor() {}
  abstract consolidadoGranjas(...args: any[]): Promise<any> | any;
  abstract detalleActivos(...args: any[]): Promise<any> | any;
  abstract mortalidadPeriodo(...args: any[]): Promise<any> | any;
  abstract nacimientosPeriodo(...args: any[]): Promise<any> | any;
  abstract poblacionAt(...args: any[]): Promise<any> | any;
  abstract porArea(...args: any[]): Promise<any> | any;
  abstract porCategoriaArea(...args: any[]): Promise<any> | any;
  abstract transfersPeriodo(...args: any[]): Promise<any> | any;
  abstract ventasPeriodo(...args: any[]): Promise<any> | any;
}
