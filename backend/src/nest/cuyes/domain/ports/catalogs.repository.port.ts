/** Domain port (repository abstraction). */
export abstract class CatalogsRepositoryPort {
  protected constructor() {}
  abstract deactivateCategoria(...args: any[]): Promise<any> | any;
  abstract deactivateRaza(...args: any[]): Promise<any> | any;
  abstract getAlertaConfig(...args: any[]): Promise<any> | any;
  abstract getAnimalesConCategoria(...args: any[]): Promise<any> | any;
  abstract getEspecieGranja(...args: any[]): Promise<any> | any;
  abstract insertCategoria(...args: any[]): Promise<any> | any;
  abstract insertRaza(...args: any[]): Promise<any> | any;
  abstract listCategorias(...args: any[]): Promise<any> | any;
  abstract listEspecies(...args: any[]): Promise<any> | any;
  abstract listRazas(...args: any[]): Promise<any> | any;
}
