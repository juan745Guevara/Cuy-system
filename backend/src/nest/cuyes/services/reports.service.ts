import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../cuyes-deps.service';
import { bindLegacyCuyesService } from '../legacy/legacy-delegate.service';

@Injectable()
export class ReportsService {
  constructor(cuyesDeps: CuyesDepsService) {
    bindLegacyCuyesService(this, cuyesDeps, 'reports', 'Reports');
  }
}
