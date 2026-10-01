/** Domain port (repository abstraction). */
export abstract class ReportsRepositoryPort {
  protected constructor() {}
  abstract getFemaleCycles(...args: any[]): Promise<any> | any;
  abstract getMaleBreedings(...args: any[]): Promise<any> | any;
  abstract getUserFarms(...args: any[]): Promise<any> | any;
  abstract getFemales(...args: any[]): Promise<any> | any;
  abstract getMales(...args: any[]): Promise<any> | any;
  abstract getFarmMetrics(...args: any[]): Promise<any> | any;
  abstract getMonthlyMortality(...args: any[]): Promise<any> | any;
  abstract getMonthlyBirths(...args: any[]): Promise<any> | any;
  abstract getActivePopulation(...args: any[]): Promise<any> | any;
  abstract getFarmPopulation(...args: any[]): Promise<any> | any;
  abstract getMonthlySales(...args: any[]): Promise<any> | any;
  abstract listAnimalsForExport(...args: any[]): Promise<any> | any;
}
