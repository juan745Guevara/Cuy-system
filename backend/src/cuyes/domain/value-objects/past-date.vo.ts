import { DomainValidationError } from '../errors/domain-validation.error';

function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = s.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A calendar date (YYYY-MM-DD) that, by business rule, may not be in the future. */
export class PastDate {
  private constructor(public readonly isoDate: string) {}

  /** Returns null for an absent value; throws if present but invalid or in the future. */
  static createOptional(raw: unknown, field: string, label: string): PastDate | null {
    if (raw == null || raw === '') return null;
    const value = String(raw);
    if (!isValidDateStr(value)) {
      throw new DomainValidationError(`Invalid ${label}`, field);
    }
    if (value > todayISO()) {
      throw new DomainValidationError(`${label} cannot be in the future`, field);
    }
    return new PastDate(value);
  }
}
