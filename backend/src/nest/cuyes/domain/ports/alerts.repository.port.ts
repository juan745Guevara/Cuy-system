/** Domain port (repository abstraction). */
export abstract class AlertsRepositoryPort {
  protected constructor() {}
  abstract findConfig(...args: any[]): Promise<any> | any;
  abstract findDescartes(...args: any[]): Promise<any> | any;
  abstract findDestetePendiente(...args: any[]): Promise<any> | any;
  abstract findEmpadreDisponible(...args: any[]): Promise<any> | any;
  abstract findPartoProximo(...args: any[]): Promise<any> | any;
  abstract findSinPrenez(...args: any[]): Promise<any> | any;
  abstract insertDescarte(...args: any[]): Promise<any> | any;
  abstract seedDefaults(...args: any[]): Promise<any> | any;
  abstract upsertConfig(...args: any[]): Promise<any> | any;
}
