import { AuthUser, UserFarm } from './auth-user.types';

export type RequestContext = {
  user?: AuthUser;
  userFarms?: UserFarm[];
  farmId?: number;
  speciesId?: number;
};
