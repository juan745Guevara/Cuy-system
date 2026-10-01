import { DomainValidationError } from '../errors/domain-validation.error';
import { NormalizedCode } from '../value-objects/normalized-code.vo';
import { PastDate } from '../value-objects/past-date.vo';

export type Sex = 'M' | 'H';

/**
 * A validated intent to register a new animal (or reuse a discharged one's code).
 * Construction enforces every invariant that used to live as ad-hoc `if`s in
 * AnimalsService — an object of this type is, by construction, always valid.
 */
export class NewAnimal {
  private constructor(
    public readonly code: NormalizedCode,
    public readonly sex: Sex,
    public readonly cageId: number,
    public readonly breedId: number | null,
    public readonly categoryId: number | null,
    public readonly birthDate: PastDate | null,
    public readonly note: string | null,
    public readonly confirmCapacity: boolean,
    public readonly confirmReuse: boolean,
  ) {}

  static register(body: Record<string, unknown>): NewAnimal {
    if (!body.codigo || !body.sexo) {
      throw new DomainValidationError('code and sex are required');
    }
    if (!['M', 'H'].includes(String(body.sexo))) {
      throw new DomainValidationError('sex must be M or H');
    }
    if (!body.id_jaula) {
      throw new DomainValidationError('cage is required', 'id_jaula');
    }

    const code = NormalizedCode.create(body.codigo);
    const birthDate = PastDate.createOptional(
      body.fecha_nacimiento,
      'fecha_nacimiento',
      'birth_date',
    );

    return new NewAnimal(
      code,
      body.sexo as Sex,
      Number(body.id_jaula),
      body.id_raza ? Number(body.id_raza) : null,
      body.id_categoria ? Number(body.id_categoria) : null,
      birthDate,
      body.particularidad ? String(body.particularidad) : null,
      Boolean(body.confirmar_capacidad),
      Boolean(body.confirmar_reuso),
    );
  }
}
