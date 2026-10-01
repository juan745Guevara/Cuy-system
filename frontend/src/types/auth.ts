export type UserRole = 'superadmin' | 'admin' | 'encargado' | 'supervisor' | string;

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface UserFarm {
  id: number;
  nombre: string;
  especie?: string;
  id_especie?: number;
  activa?: boolean;
  ubicacion?: string;
  responsable?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  granjas: UserFarm[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  granjas: UserFarm[];
  granjaActiva: number | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  seleccionarGranja: (id: number | null) => void;
}
