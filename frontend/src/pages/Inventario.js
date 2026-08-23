import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-28 población · NUC-29 resumen · NUC-36/CUY-22..24 Excel */
const Inventario = () => {
  const now = new Date();
  const [poblacion, setPoblacion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, r] = await Promise.all([
        api.get('/inventario/poblacion'),
        api.get('/inventario/resumen-mensual', { params: { anio, mes } }),
      ]);
      setPoblacion(p.data);
      setResumen(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar inventario');
    }
  }, [anio, mes]);

  useEffect(() => {
    load();
  }, [load]);

  const descargar = async (path, filename) => {
    try {
      const res = await api.get(path, {
        responseType: 'blob',
        params: path.includes('inventario-mensual') ? { anio, mes } : undefined,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo exportar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Inventario y reportes</h1>
      <p style={s.sub}>Población actual, resumen mensual y Excel oficial</p>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.row}>
        <input
          style={s.input}
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
        />
        <input
          style={s.input}
          type="number"
          min="1"
          max="12"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        />
        <button type="button" style={s.btnGhost} onClick={load}>
          Actualizar
        </button>
      </div>

      {poblacion && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Población actual: {poblacion.total}</h3>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Categoría</th>
                <th style={s.th}>Sexo</th>
                <th style={s.th}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {(poblacion.por_categoria || []).map((r, i) => (
                <tr key={i}>
                  <td style={s.td}>{r.categoria}</td>
                  <td style={s.td}>{r.sexo}</td>
                  <td style={s.td}>{r.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resumen && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Resumen {resumen.mes}/{resumen.anio}
          </h3>
          <p>Nacimientos: {resumen.nacimientos}</p>
          <p>Mortalidad: {resumen.mortalidad}</p>
          <p>Ventas: {resumen.ventas}</p>
          <p>Población actual: {resumen.poblacion_actual}</p>
        </div>
      )}

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>Exportar Excel</h3>
        <div style={s.row}>
          <button
            type="button"
            style={s.btn}
            onClick={() => descargar('/reportes/hembras', 'registro-hembras.xlsx')}
          >
            Hembras (CUY-22)
          </button>
          <button
            type="button"
            style={s.btn}
            onClick={() => descargar('/reportes/machos', 'registro-machos.xlsx')}
          >
            Machos (CUY-23)
          </button>
          <button
            type="button"
            style={s.btn}
            onClick={() =>
              descargar('/reportes/inventario-mensual', `inventario-${anio}-${mes}.xlsx`)
            }
          >
            Inventario mensual (CUY-24 / NUC-36)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventario;
