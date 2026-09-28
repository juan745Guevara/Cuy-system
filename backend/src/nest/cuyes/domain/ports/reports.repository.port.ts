/** Domain port (repository abstraction). */
export abstract class ReportsRepositoryPort {
  protected constructor() {}
  abstract getCiclosHembras(...args: any[]): Promise<any> | any;
  abstract getEmpadresMachos(...args: any[]): Promise<any> | any;
  abstract getGranjasUsuario(...args: any[]): Promise<any> | any;
  abstract getHembras(...args: any[]): Promise<any> | any;
  abstract getMachos(...args: any[]): Promise<any> | any;
  abstract getMetricasGranja(...args: any[]): Promise<any> | any;
  abstract getMortalidadMes(...args: any[]): Promise<any> | any;
  abstract getNacimientosMes(...args: any[]): Promise<any> | any;
  abstract getPopulationActiva(...args: any[]): Promise<any> | any;
  abstract getPopulationGranja(...args: any[]): Promise<any> | any;
  abstract getVentasMes(...args: any[]): Promise<any> | any;
  abstract listAnimalesExport(...args: any[]): Promise<any> | any;
}
