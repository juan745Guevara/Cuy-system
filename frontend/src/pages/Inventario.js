import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

async function blobErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json.error || json.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.error || data?.message || fallback;
}

/** NUC-28/29/31/32 · NUC-36/CUY-22..24 Excel */
const Inventario = () => {
  const now = new Date();
  const [poblacion, setPoblacion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [porArea, setPorArea] = useState([]);
  const [consolidado, setConsolidado] = useState(null);
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, r, a, c] = await Promise.all([
        api.get('/inventario/poblacion'),
        api.get('/inventario/resumen-mensual', { params: { anio, mes } }),
        api.get('/inventario/por-area'),
        api.get('/inventario/consolidado', { params: { anio, mes } }),
      ]);
      setPoblacion(p.data);
      setResumen(r.data);
      setPorArea(a.data);
      setConsolidado(c.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar inventario');
    }
  }, [anio, mes]);

  useEffect(() => {
    load();
  }, [load]);

  const descargar = async (path, filename) => {
    setError('');
    try {
      const res = await api.get(path, {
        responseType: 'blob',
        params: path.includes('inventario-mensual') ? { anio, mes } : undefined,
      });
      if (res.status === 204 || (res.data && res.data.size === 0)) {
        setError('No hay datos para exportar');
        return;
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const status = err.response?.status;
      const msg = await blobErrorMessage(err, 'No se pudo exportar');
      if (status === 409 || status === 400) {
        setError(msg || 'No hay datos suficientes para generar el reporte');
      } else {
        setError(msg);
      }
    }
  };

  const matriz =
    poblacion?.matriz ||
    poblacion?.por_raza ||
    (Array.isArray(poblacion?.matriz_raza_categoria) ? poblacion.matriz_raza_categoria : null);

  const renderMatriz = () => {
    if (!matriz) return null;

    // Formato filas: [{ raza, categoria, cantidad }] o { [raza]: { [cat]: n } }
    if (Array.isArray(matriz)) {
      const razas = [...new Set(matriz.map((r) => r.raza || r.nombre_raza || '—'))];
      const cats = [...new Set(matriz.map((r) => r.categoria || r.nombre_categoria || '—'))];
      const lookup = {};
      matriz.forEach((r) => {
        const rz = r.raza || r.nombre_raza || '—';
        const ct = r.categoria || r.nombre_categoria || '—';
        lookup[`${rz}||${ct}`] = r.cantidad ?? r.n ?? 0;
      });
      return (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Raza \\ Categoría</th>
              {cats.map((c) => (
                <th key={c} style={s.th}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {razas.map((rz) => (
              <tr key={rz}>
                <td style={s.td}>{rz}</td>
                {cats.map((ct) => (
                  <td key={ct} style={s.td}>
                    {lookup[`${rz}||${ct}`] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (typeof matriz === 'object') {
      const razas = Object.keys(matriz);
      const cats = [...new Set(razas.flatMap((rz) => Object.keys(matriz[rz] || {})))];
      return (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Raza \\ Categoría</th>
              {cats.map((c) => (
                <th key={c} style={s.th}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {razas.map((rz) => (
              <tr key={rz}>
                <td style={s.td}>{rz}</td>
                {cats.map((ct) => (
                  <td key={ct} style={s.td}>
                    {matriz[rz]?.[ct] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Inventario y reportes</h1>
      <p style={s.sub}>Población, consolidado multi-granja y Excel oficial</p>
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
          {matriz ? (
            <>
              <p style={{ color: '#7A6358', marginTop: 0 }}>Matriz raza × categoría</p>
              {renderMatriz()}
            </>
          ) : (
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
          )}
        </div>
      )}

      {resumen && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Resumen {resumen.mes}/{resumen.anio}
          </h3>
          <p>Población inicial: {resumen.poblacion_inicial ?? '—'}</p>
          <p>Nacimientos: {resumen.nacimientos ?? '—'}</p>
          <p>Mortalidad: {resumen.mortalidad ?? '—'}</p>
          <p>Ventas: {resumen.ventas ?? '—'}</p>
          <p>Transferencias in: {resumen.transferencias_in ?? '—'}</p>
          <p>Transferencias out: {resumen.transferencias_out ?? '—'}</p>
          <p>
            Población final:{' '}
            {resumen.poblacion_final ?? resumen.poblacion_actual ?? '—'}
          </p>
          {resumen.desglose_categorias && (
            <>
              <p style={{ marginBottom: 4 }}>
                <strong>Desglose por categoría</strong>
              </p>
              <ul>
                {(Array.isArray(resumen.desglose_categorias)
                  ? resumen.desglose_categorias
                  : Object.entries(resumen.desglose_categorias).map(([k, v]) => ({
                      categoria: k,
                      cantidad: v,
                    }))
                ).map((d, i) => (
                  <li key={i}>
                    {d.categoria || d.nombre}: {d.cantidad ?? d.n ?? '—'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>Población por área (NUC-31)</h3>
        {porArea.map((a) => (
          <div key={a.id} style={{ marginBottom: '0.75rem' }}>
            <strong>
              {a.nombre} ({a.proposito}) — {a.total} animales
            </strong>
            <ul>
              {(a.jaulas || []).map((j) => (
                <li key={j.id}>
                  {j.codigo}: {j.ocupacion}
                  {j.capacidad_maxima != null ? ` / ${j.capacidad_maxima}` : ''} (H:{j.hembras}{' '}
                  M:{j.machos})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {consolidado && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Consolidado institucional {consolidado.mes}/{consolidado.anio} (NUC-30/32)
          </h3>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Granja</th>
                <th style={s.th}>Especie</th>
                <th style={s.th}>Población</th>
                <th style={s.th}>Nacimientos</th>
                <th style={s.th}>Mortalidad</th>
                <th style={s.th}>Ventas</th>
              </tr>
            </thead>
            <tbody>
              {(consolidado.granjas || []).map((g) => (
                <tr key={g.id}>
                  <td style={s.td}>{g.nombre}</td>
                  <td style={s.td}>{g.especie}</td>
                  <td style={s.td}>{g.poblacion}</td>
                  <td style={s.td}>{g.nacimientos}</td>
                  <td style={s.td}>{g.mortalidad}</td>
                  <td style={s.td}>{g.ventas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {consolidado.total && (
            <p>
              Total: pob {consolidado.total.poblacion} · nac {consolidado.total.nacimientos} · mort{' '}
              {consolidado.total.mortalidad} · ventas {consolidado.total.ventas}
            </p>
          )}
        </div>
      )}

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>Exportar Excel (NUC-36/37 · CUY-22..24)</h3>
        <p style={{ color: '#7A6358', marginTop: 0 }}>
          Alcance: granja activa · periodo {mes}/{anio}
        </p>
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
          <button
            type="button"
            style={s.btnGhost}
            onClick={() =>
              descargar(
                `/reportes/animales?anio=${anio}&mes=${mes}`,
                `animales-${anio}-${mes}.xlsx`
              )
            }
          >
            Listado animales (NUC-37)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventario;
