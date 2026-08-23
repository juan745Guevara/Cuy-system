import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-13 administrar jaulas · CUY-03 */
const Jaulas = () => {
  const [jaulas, setJaulas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [idArea, setIdArea] = useState('');
  const [codigo, setCodigo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [ocupantes, setOcupantes] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [j, a] = await Promise.all([api.get('/jaulas'), api.get('/areas')]);
      setJaulas(j.data);
      setAreas(a.data);
      if (!idArea && a.data[0]) setIdArea(String(a.data[0].id));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar jaulas');
    }
  }, [idArea]);

  useEffect(() => {
    load();
  }, [load]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/jaulas', {
        id_area: Number(idArea),
        codigo,
        capacidad_maxima: capacidad ? Number(capacidad) : null,
      });
      setOk(`Jaula ${codigo} creada`);
      setCodigo('');
      setCapacidad('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la jaula');
    }
  };

  const verAnimales = async (id) => {
    try {
      const { data } = await api.get(`/jaulas/${id}/animales`);
      setOcupantes({ id, data });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron listar animales');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Jaulas</h1>
      <p style={s.sub}>Ubicación física dentro de cada área</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <select style={s.select} required value={idArea} onChange={(e) => setIdArea(e.target.value)}>
          <option value="">Área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <input
          style={s.input}
          required
          placeholder="Código jaula"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <input
          style={s.input}
          type="number"
          min="1"
          placeholder="Capacidad máx."
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
        />
        <button type="submit" style={s.btn}>
          Crear jaula
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Código</th>
            <th style={s.th}>Área</th>
            <th style={s.th}>Propósito</th>
            <th style={s.th}>Ocupación</th>
            <th style={s.th}>Capacidad</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {jaulas.map((j) => (
            <tr key={j.id}>
              <td style={s.td}>{j.codigo}</td>
              <td style={s.td}>{j.area}</td>
              <td style={s.td}>{j.proposito}</td>
              <td style={s.td}>{j.ocupacion}</td>
              <td style={s.td}>{j.capacidad_maxima ?? '—'}</td>
              <td style={s.td}>
                <button type="button" style={s.btnGhost} onClick={() => verAnimales(j.id)}>
                  Ver animales
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ocupantes && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Animales en jaula #{ocupantes.id}</h3>
          {ocupantes.data.length === 0 ? (
            <p>Vacía</p>
          ) : (
            <ul>
              {ocupantes.data.map((a) => (
                <li key={a.id}>
                  {a.codigo} ({a.sexo})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Jaulas;
