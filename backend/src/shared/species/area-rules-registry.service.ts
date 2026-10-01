import { Injectable } from '@nestjs/common';
import { AreaRulesPort, createNoOpAreaRules } from './area-rules.port';

/** Species-specific area validation rules (registered by each species module). */
@Injectable()
export class AreaRulesRegistry {
  private readonly bySpecies = new Map<string, AreaRulesPort>();

  register(speciesNombre: string, rules: AreaRulesPort): void {
    this.bySpecies.set(speciesNombre.trim().toLowerCase(), rules);
  }

  forSpecies(speciesNombre: string | undefined): AreaRulesPort {
    if (!speciesNombre) return createNoOpAreaRules();
    return (
      this.bySpecies.get(speciesNombre.trim().toLowerCase()) ??
      createNoOpAreaRules()
    );
  }
}
