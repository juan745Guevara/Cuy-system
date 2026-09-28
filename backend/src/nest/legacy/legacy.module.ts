import { Module } from '@nestjs/common';
import { CuyesLegacyModule } from './cuyes-legacy.module';

@Module({
  providers: [CuyesLegacyModule],
})
export class LegacyBootstrapModule {}
