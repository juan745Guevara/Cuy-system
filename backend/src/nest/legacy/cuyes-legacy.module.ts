import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SharedDepsService } from '../shared/deps/shared-deps.service';

/** Mounts the legacy Express cuyes module until full Nest migration. */
@Injectable()
export class CuyesLegacyModule implements OnModuleInit {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createCuyesModule = require('../../modules/cuyes');
    const expressApp = this.adapterHost.httpAdapter.getInstance();
    expressApp.use('/api/v1/cuyes', createCuyesModule(this.sharedDeps.toDeps()));
  }
}
