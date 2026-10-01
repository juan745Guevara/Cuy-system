/** Domain port (repository abstraction). */
export abstract class WeighingsRepositoryPort {
  protected constructor() {}
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract getRangeRows(...args: any[]): Promise<any> | any;
  abstract insertWeighing(...args: any[]): Promise<any> | any;
  abstract listByAnimal(...args: any[]): Promise<any> | any;
  abstract average(...args: any[]): Promise<any> | any;
  abstract saveRanges(...args: any[]): Promise<any> | any;
  abstract seedRanges(...args: any[]): Promise<any> | any;
}
