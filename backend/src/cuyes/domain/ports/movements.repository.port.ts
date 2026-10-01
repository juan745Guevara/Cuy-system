/** Domain port (repository abstraction). */
export abstract class MovementsRepositoryPort {
  protected constructor() {}
  abstract currentAnimalsInCage(...args: any[]): Promise<any> | any;
  abstract animalsOnDate(...args: any[]): Promise<any> | any;
  abstract codeExistsInFarm(...args: any[]): Promise<any> | any;
  abstract executeTransfer(...args: any[]): Promise<any> | any;
  abstract executeRelocation(...args: any[]): Promise<any> | any;
  abstract findCageInFarm(...args: any[]): Promise<any> | any;
  abstract getActiveAnimals(...args: any[]): Promise<any> | any;
  abstract getAnimalsFromCage(...args: any[]): Promise<any> | any;
  abstract getTransferAnimals(...args: any[]): Promise<any> | any;
  abstract getActiveFarm(...args: any[]): Promise<any> | any;
  abstract getFarmSpecies(...args: any[]): Promise<any> | any;
  abstract getCage(...args: any[]): Promise<any> | any;
  abstract animalHistory(...args: any[]): Promise<any> | any;
  abstract cageHistory(...args: any[]): Promise<any> | any;
  abstract listAnimalsWithArea(...args: any[]): Promise<any> | any;
  abstract listDestinationCages(...args: any[]): Promise<any> | any;
  abstract listRecent(...args: any[]): Promise<any> | any;
  abstract listOvercapacity(...args: any[]): Promise<any> | any;
}
