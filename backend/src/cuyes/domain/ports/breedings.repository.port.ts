/** Domain port (repository abstraction). */
export abstract class BreedingsRepositoryPort {
  protected constructor() {}
  abstract closeBreeding(...args: any[]): Promise<any> | any;
  abstract createBreeding(...args: any[]): Promise<any> | any;
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract findBreeding(...args: any[]): Promise<any> | any;
  abstract findBreedingFemale(...args: any[]): Promise<any> | any;
  abstract findFemaleAnyState(...args: any[]): Promise<any> | any;
  abstract findMale(...args: any[]): Promise<any> | any;
  abstract getFemalesByCage(...args: any[]): Promise<any> | any;
  abstract getLastBirthDate(...args: any[]): Promise<any> | any;
  abstract getBirthsByFemale(...args: any[]): Promise<any> | any;
  abstract getMaleBreedingCycles(...args: any[]): Promise<any> | any;
  abstract getFemaleBreedingCycles(...args: any[]): Promise<any> | any;
  abstract insertNote(...args: any[]): Promise<any> | any;
  abstract insertBreedingMale(...args: any[]): Promise<any> | any;
  abstract listBreedings(...args: any[]): Promise<any> | any;
  abstract markFemaleDeceased(...args: any[]): Promise<any> | any;
  abstract updateBreedingFemaleResult(...args: any[]): Promise<any> | any;
}
