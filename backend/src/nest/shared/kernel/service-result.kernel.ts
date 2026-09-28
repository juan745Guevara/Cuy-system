export type ServiceResult<T = unknown> = {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
  [key: string]: unknown;
};

export function ok<T>(data: T, status = 200): ServiceResult<T> {
  return { ok: true, status, data };
}

export function fail(
  error: string,
  status = 400,
  extra: Record<string, unknown> = {},
): ServiceResult {
  return { ok: false, status, error, ...extra };
}

export function fromError(err: any, _fallbackStatus = 500): ServiceResult {
  if (err.status) return fail(err.message, err.status);
  if (err.code === '23505') return fail('Duplicate record', 409);
  throw err;
}
