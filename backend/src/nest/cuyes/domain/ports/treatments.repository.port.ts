/** Domain port (repository abstraction). */
export abstract class TreatmentsRepositoryPort {
  protected constructor() {}
  abstract complete(...args: any[]): Promise<any> | any;
  abstract getAnimalesByArea(...args: any[]): Promise<any> | any;
  abstract getAnimalesByJaula(...args: any[]): Promise<any> | any;
  abstract insert(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract listEnCurso(...args: any[]): Promise<any> | any;
}
