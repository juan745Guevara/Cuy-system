/** Maps ServiceResult → HTTP response (presentation layer SRP). */
function sendResult(res, result) {
  if (result.ok) {
    const status = result.status || 200;
    if (status === 204) return res.status(204).end();
    return res.status(status).json(result.data);
  }
  const body = { error: result.error };
  if (result.campo) body.campo = result.campo;
  if (result.requiere_confirmacion) body.requiere_confirmacion = result.requiere_confirmacion;
  if (result.sugerencia) body.sugerencia = result.sugerencia;
  if (result.codigo) body.codigo = result.codigo;
  if (result.animal) body.animal = result.animal;
  if (result.disponible != null) body.disponible = result.disponible;
  if (result.ocupacion_actual != null) body.ocupacion_actual = result.ocupacion_actual;
  if (result.capacidad_maxima != null) body.capacidad_maxima = result.capacidad_maxima;
  if (result.granjas_invalidas) body.granjas_invalidas = result.granjas_invalidas;
  if (result.propositos) body.propositos = result.propositos;
  if (result.jaulas != null) body.jaulas = result.jaulas;
  if (result.id_hembra != null) body.id_hembra = result.id_hembra;
  if (result.animales != null) body.animales = result.animales;
  if (result.proposito_area != null) body.proposito_area = result.proposito_area;
  if (result.proposito_normalizado != null) body.proposito_normalizado = result.proposito_normalizado;
  if (result.a_mover != null) body.a_mover = result.a_mover;
  if (result.rango != null) body.rango = result.rango;
  return res.status(result.status || 400).json(body);
}

module.exports = { sendResult };
