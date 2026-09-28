/** Domain port (repository abstraction). */
export abstract class RankingRepositoryPort {
  protected constructor() {}
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract findReplacementCategory(...args: any[]): Promise<any> | any;
  abstract findConfig(...args: any[]): Promise<any> | any;
  abstract findFemaleRanking(...args: any[]): Promise<any> | any;
  abstract findMaleRanking(...args: any[]): Promise<any> | any;
  abstract insertDefaultConfig(...args: any[]): Promise<any> | any;
  abstract insertNote(...args: any[]): Promise<any> | any;
  abstract markDiscard(...args: any[]): Promise<any> | any;
  abstract markReplacement(...args: any[]): Promise<any> | any;
  abstract upsertConfig(...args: any[]): Promise<any> | any;
}
