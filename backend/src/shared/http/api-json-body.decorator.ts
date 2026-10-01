import { ApiBody, type SchemaObject } from '@nestjs/swagger';

type FieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'integer[]'
  | 'string[]'
  | 'object[]';

type Field =
  | FieldType
  | { type: FieldType; description?: string; enum?: string[]; example?: unknown };

const BASE: Record<FieldType, SchemaObject> = {
  string: { type: 'string' },
  integer: { type: 'integer' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date', example: '2026-10-01' },
  object: { type: 'object', additionalProperties: true },
  'integer[]': { type: 'array', items: { type: 'integer' } },
  'string[]': { type: 'array', items: { type: 'string' } },
  'object[]': { type: 'array', items: { type: 'object', additionalProperties: true } },
};

function toSchema(field: Field): SchemaObject {
  if (typeof field === 'string') return BASE[field];
  const { type, ...extra } = field;
  return { ...BASE[type], ...extra };
}

/** Documents an untyped `@Body()` as a JSON object with the given fields. */
export function ApiJsonBody(
  fields: Record<string, Field>,
  required: string[] = [],
) {
  return ApiBody({
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(fields).map(([name, f]) => [name, toSchema(f)]),
      ),
      ...(required.length ? { required } : {}),
    },
  });
}
