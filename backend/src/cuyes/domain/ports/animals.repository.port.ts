import { NewAnimal } from '../entities/animal.entity';

export interface InsertNewAnimalParams {
  farmId: number;
  userId: number;
  animal: NewAnimal;
}

export interface ReuseDischargedCodeParams {
  userId: number;
  existente: { id: number; codigo: string; estado: string };
  animal: NewAnimal;
}

/** Domain port (repository abstraction). */
export abstract class AnimalsRepositoryPort {
  protected constructor() {}
  abstract findByNormalizedCode(...args: any[]): Promise<any> | any;
  abstract findByNormalizedCodeRaw(...args: any[]): Promise<any> | any;
  abstract findById(...args: any[]): Promise<any> | any;
  abstract findActiveCage(...args: any[]): Promise<any> | any;
  abstract getHistory(...args: any[]): Promise<any> | any;
  abstract getTreatments(...args: any[]): Promise<any> | any;
  abstract insertNew(params: InsertNewAnimalParams): Promise<any> | any;
  abstract insertNote(...args: any[]): Promise<any> | any;
  abstract list(...args: any[]): Promise<any> | any;
  abstract reuseDischargedCode(params: ReuseDischargedCodeParams): Promise<any> | any;
  abstract update(...args: any[]): Promise<any> | any;
}
