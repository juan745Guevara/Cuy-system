import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * A user-entered code together with its normalized form (no spaces, uppercase)
 * used for uniqueness checks. Encapsulates the one rule that matters: a code
 * that normalizes to nothing is not a valid code.
 */
export class NormalizedCode {
  private constructor(
    public readonly original: string,
    public readonly normalized: string,
  ) {}

  static create(raw: unknown): NormalizedCode {
    const original = String(raw ?? '').trim();
    const normalized = original.replace(/\s+/g, '').toUpperCase();
    if (!normalized) {
      throw new DomainValidationError('Invalid code');
    }
    return new NormalizedCode(original, normalized);
  }

  /** Normalizes a raw value for comparison/search without enforcing the non-empty rule. */
  static normalize(raw: unknown): string {
    if (raw == null) return '';
    return String(raw).replace(/\s+/g, '').toUpperCase();
  }
}
