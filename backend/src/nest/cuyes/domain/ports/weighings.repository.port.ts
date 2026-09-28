/** Domain port (repository abstraction). */
export abstract class WeighingsRepositoryPort {
  protected constructor() {}
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract getRangosRows(...args: any[]): Promise<any> | any;
  abstract insertPesaje(...args: any[]): Promise<any> | any;
  abstract listByAnimal(...args: any[]): Promise<any> | any;
  abstract promedio(...args: any[]): Promise<any> | any;
  abstract saveRangos(...args: any[]): Promise<any> | any;
  abstract seedRangos(...args: any[]): Promise<any> | any;
}
