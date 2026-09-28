export type AuthUser = {
  id: number;
  email: string;
  rol: string;
  nombre: string;
};

export type UserFarm = {
  id: number;
  nombre: string;
  id_especie: number;
  especie: string;
};
