import { Global, Module } from '@nestjs/common';
import { SharedDepsService } from './shared-deps.service';

@Global()
@Module({
  providers: [SharedDepsService],
  exports: [SharedDepsService],
})
export class SharedDepsModule {}
