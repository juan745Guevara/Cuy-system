/** Domain port (repository abstraction). */
export abstract class TreatmentsRepositoryPort {
  protected constructor() {}
  abstract complete(...args: any[]): Promise<any> | any;
  abstract getAnimalsByArea(...args: any[]): Promise<any> | any;
  abstract getAnimalsByCage(...args: any[]): Promise<any> | any;
  abstract insert(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract listOngoing(...args: any[]): Promise<any> | any;
}
