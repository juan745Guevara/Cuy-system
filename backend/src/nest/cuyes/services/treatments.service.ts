import { Injectable } from '@nestjs/common';
import { CuyesDepsService } from '../cuyes-deps.service';
import { bindLegacyCuyesService } from '../legacy/legacy-delegate.service';

@Injectable()
export class TreatmentsService {
  constructor(cuyesDeps: CuyesDepsService) {
    bindLegacyCuyesService(this, cuyesDeps, 'treatments', 'Treatments');
  }
}
