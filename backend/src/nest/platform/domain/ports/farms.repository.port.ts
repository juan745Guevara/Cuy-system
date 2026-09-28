/** Domain port (repository abstraction). */
export abstract class FarmsRepositoryPort {
  protected constructor() {}
  abstract assignUsers(...args: any[]): Promise<any> | any;
  abstract deactivate(...args: any[]): Promise<any> | any;
  abstract insert(...args: any[]): Promise<any> | any;
}
