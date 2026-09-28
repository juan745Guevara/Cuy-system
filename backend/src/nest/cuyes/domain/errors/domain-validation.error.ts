/** A business-rule violation raised while building or mutating a domain object. */
export class DomainValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'DomainValidationError';
  }
}
