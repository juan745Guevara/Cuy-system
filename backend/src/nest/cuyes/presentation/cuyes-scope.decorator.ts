import { FarmScope } from '../../shared/decorators/farm-scope.decorator';

/** @deprecated Use FarmScope — cuyes routes share the same farm + species guards. */
export function CuyesFarmScope() {
  return FarmScope();
}
