import { Injectable } from '@nestjs/common';
import { SharedDepsService } from '../shared/deps/shared-deps.service';

/** Cuyes module deps (shared kernel + species area rules). */
@Injectable()
export class CuyesDepsService {
  constructor(private readonly shared: SharedDepsService) {}

  toDeps() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cuyesAreaRules = require('../../modules/cuyes/domain/areaRules.adapter');
    return { ...this.shared.toDeps(), areaRules: cuyesAreaRules };
  }
}
