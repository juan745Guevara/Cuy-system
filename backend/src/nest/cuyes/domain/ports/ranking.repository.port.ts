/** Domain port (repository abstraction). */
export abstract class RankingRepositoryPort {
  protected constructor() {}
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract findCategoriaReemplazo(...args: any[]): Promise<any> | any;
  abstract findConfig(...args: any[]): Promise<any> | any;
  abstract findRankingHembras(...args: any[]): Promise<any> | any;
  abstract findRankingMachos(...args: any[]): Promise<any> | any;
  abstract insertDefaultConfig(...args: any[]): Promise<any> | any;
  abstract insertParticularidad(...args: any[]): Promise<any> | any;
  abstract markDescarte(...args: any[]): Promise<any> | any;
  abstract markReemplazo(...args: any[]): Promise<any> | any;
  abstract upsertConfig(...args: any[]): Promise<any> | any;
}
