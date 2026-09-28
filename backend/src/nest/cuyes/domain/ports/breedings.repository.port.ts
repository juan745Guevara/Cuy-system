/** Domain port (repository abstraction). */
export abstract class BreedingsRepositoryPort {
  protected constructor() {}
  abstract closeBreeding(...args: any[]): Promise<any> | any;
  abstract createEmpadre(...args: any[]): Promise<any> | any;
  abstract findAnimal(...args: any[]): Promise<any> | any;
  abstract findEmpadre(...args: any[]): Promise<any> | any;
  abstract findEmpadreHembra(...args: any[]): Promise<any> | any;
  abstract findHembraAnyState(...args: any[]): Promise<any> | any;
  abstract findMacho(...args: any[]): Promise<any> | any;
  abstract getHembrasByJaula(...args: any[]): Promise<any> | any;
  abstract getLastPartoDate(...args: any[]): Promise<any> | any;
  abstract getPartosByHembra(...args: any[]): Promise<any> | any;
  abstract getReproductorCiclos(...args: any[]): Promise<any> | any;
  abstract getReproductoraCiclos(...args: any[]): Promise<any> | any;
  abstract insertParticularidad(...args: any[]): Promise<any> | any;
  abstract insertReproductor(...args: any[]): Promise<any> | any;
  abstract listEmpadres(...args: any[]): Promise<any> | any;
  abstract markHembraMuerta(...args: any[]): Promise<any> | any;
  abstract updateEmpadreHembraResultado(...args: any[]): Promise<any> | any;
}
