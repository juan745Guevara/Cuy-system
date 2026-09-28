import { Injectable } from '@nestjs/common';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';
import { cuyesAreaRules } from '../domain/cuyes-area-rules';

/** Cuyes module deps (shared kernel + species area rules). */
@Injectable()
export class CuyesDepsService {
  constructor(private readonly shared: SharedDepsService) {}

  toDeps() {
    return { ...this.shared.toDeps(), areaRules: cuyesAreaRules };
  }
}
