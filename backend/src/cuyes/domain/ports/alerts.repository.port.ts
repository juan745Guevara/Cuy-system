/** Domain port (repository abstraction). */
export abstract class AlertsRepositoryPort {
  protected constructor() {}
  abstract findConfig(...args: any[]): Promise<any> | any;
  abstract findDiscards(...args: any[]): Promise<any> | any;
  abstract findPendingWeanings(...args: any[]): Promise<any> | any;
  abstract findAvailableBreeding(...args: any[]): Promise<any> | any;
  abstract findUpcomingBirths(...args: any[]): Promise<any> | any;
  abstract findWithoutPregnancy(...args: any[]): Promise<any> | any;
  abstract insertDiscard(...args: any[]): Promise<any> | any;
  abstract seedDefaults(...args: any[]): Promise<any> | any;
  abstract upsertConfig(...args: any[]): Promise<any> | any;
}
