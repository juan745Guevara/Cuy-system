/** Domain port (repository abstraction). */
export abstract class InventoryRepositoryPort {
  protected constructor() {}
  abstract consolidatedFarms(...args: any[]): Promise<any> | any;
  abstract activeDetail(...args: any[]): Promise<any> | any;
  abstract mortalityInPeriod(...args: any[]): Promise<any> | any;
  abstract birthsInPeriod(...args: any[]): Promise<any> | any;
  abstract populationAt(...args: any[]): Promise<any> | any;
  abstract byArea(...args: any[]): Promise<any> | any;
  abstract byCategoryArea(...args: any[]): Promise<any> | any;
  abstract transfersInPeriod(...args: any[]): Promise<any> | any;
  abstract salesInPeriod(...args: any[]): Promise<any> | any;

  // Conteo físico por jaula (CU-06)
  abstract findActiveCage(farmId: number, jaulaId: number): Promise<{ id: number; codigo: string } | null>;
  abstract countRegisteredBySex(farmId: number, jaulaId: number): Promise<{ machos: number; hembras: number }>;
  abstract insertCount(data: NewInventoryCount): Promise<any>;
  abstract listCounts(
    farmId: number,
    filters: { desde?: string; hasta?: string; jaulaId?: number },
  ): Promise<any[]>;
}

/** Datos de un conteo físico: lo contado y la foto de lo registrado en el sistema. */
export type NewInventoryCount = {
  farmId: number;
  userId: number;
  jaulaId: number;
  fecha: string;
  machosContados: number;
  hembrasContadas: number;
  machosSistema: number;
  hembrasSistema: number;
  pesos: [number | null, number | null, number | null];
  observaciones: string | null;
};
