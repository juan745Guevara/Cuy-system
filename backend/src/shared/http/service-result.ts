import { HttpException, StreamableFile } from '@nestjs/common';

export type ServiceResult = {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
  [key: string]: unknown;
};

/** Maps application ServiceResult to JSON body or HTTP exception. */
export function unwrapServiceResult(result: ServiceResult) {
  if (result.ok) {
    if (result.status === 204) return null;
    return result.data;
  }

  const body: Record<string, unknown> = { error: result.error };
  const extraKeys = [
    'campo',
    'requiere_confirmacion',
    'sugerencia',
    'codigo',
    'animal',
    'disponible',
    'ocupacion_actual',
    'capacidad_maxima',
    'granjas_invalidas',
    'propositos',
    'jaulas',
    'id_hembra',
    'animales',
    'proposito_area',
    'proposito_normalizado',
    'a_mover',
    'rango',
  ];
  for (const key of extraKeys) {
    if (result[key] != null) body[key] = result[key];
  }

  throw new HttpException(body, (result.status as number) || 400);
}

/** Excel/binary exports as Nest StreamableFile (no Express response object). */
export function exportToStreamableFile(result: ServiceResult): StreamableFile {
  if (!result.ok) {
    unwrapServiceResult(result);
  }
  const data = result.data as {
    buffer: Buffer;
    filename: string;
    contentType: string;
  };
  return new StreamableFile(data.buffer, {
    type: data.contentType,
    disposition: `attachment; filename="${data.filename}"`,
  });
}
