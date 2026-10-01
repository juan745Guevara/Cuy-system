/** Domain port (repository abstraction). */
export abstract class CatalogsRepositoryPort {
  protected constructor() {}
  abstract deactivateCategory(...args: any[]): Promise<any> | any;
  abstract deactivateBreed(...args: any[]): Promise<any> | any;
  abstract getAlertConfig(...args: any[]): Promise<any> | any;
  abstract getAnimalsWithCategory(...args: any[]): Promise<any> | any;
  abstract getFarmSpecies(...args: any[]): Promise<any> | any;
  abstract insertCategory(...args: any[]): Promise<any> | any;
  abstract insertBreed(...args: any[]): Promise<any> | any;
  abstract listCategories(...args: any[]): Promise<any> | any;
  abstract listSpecies(...args: any[]): Promise<any> | any;
  abstract listBreeds(...args: any[]): Promise<any> | any;
}
