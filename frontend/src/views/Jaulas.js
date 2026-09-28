'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** Administrar jaulas · control de capacidad */
const Jaulas = () => {
  const [jaulas, setJaulas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [ocupacion, setOcupacion] = useState(null);
  const [idArea, setIdArea] = useState('');
  const [codigo, setCodigo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [ocupantes, setOcupantes] = useState(null);
  const [edit, setEdit] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [j, a, o] = await Promise.all([
        api.get('/recintos'),
        api.get('/areas'),
        api.get('/recintos/occupancy'),
      ]);
      setJaulas(j.data);
      setAreas(a.data);
      setOcupacion(o.data);
      setIdArea((prev) => prev || (a.data[0] ? String(a.data[0].id) : ''));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar jaulas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/recintos', {
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

  const guardarEdit = async (e) => {
    e.preventDefault();
    if (!edit) return;
    setError('');
    setOk('');
    try {
      await api.patch(`/recintos/${edit.id}`, {
        codigo: edit.codigo,
        capacidad_maxima: edit.capacidad ? Number(edit.capacidad) : null,
        id_area: Number(edit.id_area),
      });
      setOk(`Jaula ${edit.codigo} actualizada`);
      setEdit(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const deactivate = async (j) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/recintos/${j.id}/deactivate`);
      setOk(`Jaula ${j.codigo} desactivada`);
      if (ocupantes?.id === j.id) setOcupantes(null);
      if (edit?.id === j.id) setEdit(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo deactivate');
    }
  };

  const verAnimales = async (id) => {
    try {
      const { data } = await api.get(`/recintos/${id}/animals`);
      setOcupantes({ id, data });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron list animales');
    }
  };

  const ocupLabel = (j) => {
    const occ = j.ocupacion ?? 0;
    const cap = j.capacidad_maxima ?? j.capacidad ?? null;
    if (cap != null) return `${occ} / ${cap}`;
    return String(occ);
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Jaulas</h1>
      <p style={s.sub}>Ubicación física dentro de cada área</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {ocupacion && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Ocupación</h3>
          <p>
            Granja: <strong>{ocupacion.granja?.ocupacion ?? 0}</strong>
            {ocupacion.granja?.capacidad != null
              ? ` / ${ocupacion.granja.capacidad} cupos`
              : ' animales'}
          </p>
          {(ocupacion.sobrecupo || []).length > 0 && (
            <div style={{ ...s.error, marginBottom: '0.75rem' }}>
              Jaulas sobre capacidad:{' '}
              {ocupacion.sobrecupo
                .map((x) => `${x.area}/${x.codigo} (${x.ocupacion}/${x.capacidad_maxima})`)
                .join(' · ')}
            </div>
          )}
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {(ocupacion.areas || []).map((a) => (
              <li key={a.id}>
                {a.nombre}: {a.ocupacion}
                {a.capacidad ? ` / ${a.capacidad}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {edit && (
        <form onSubmit={guardarEdit} style={{ ...s.card, ...s.row }}>
          <strong>Editar jaula #{edit.id}</strong>
          <select
            style={s.select}
            required
            value={edit.id_area}
            onChange={(e) => setEdit({ ...edit, id_area: e.target.value })}
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <input
            style={s.input}
            required
            value={edit.codigo}
            onChange={(e) => setEdit({ ...edit, codigo: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            min="1"
            placeholder="Capacidad"
            value={edit.capacidad}
            onChange={(e) => setEdit({ ...edit, capacidad: e.target.value })}
          />
          <button type="submit" style={s.btn}>
            Guardar
          </button>
          <button type="button" style={s.btnGhost} onClick={() => setEdit(null)}>
            Cancelar
          </button>
        </form>
      )}

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Código</th>
            <th style={s.th}>Área</th>
            <th style={s.th}>Propósito</th>
            <th style={s.th}>Ocupación</th>
            <th style={s.th}>Capacidad</th>
            <th style={s.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jaulas.map((j) => (
            <tr key={j.id}>
              <td style={s.td}>{j.codigo}</td>
              <td style={s.td}>{j.area || j.nombre_area || '—'}</td>
              <td style={s.td}>{j.proposito || '—'}</td>
              <td style={s.td}>{ocupLabel(j)}</td>
              <td style={s.td}>{j.capacidad_maxima ?? j.capacidad ?? '—'}</td>
              <td style={s.td}>
                <button
                  type="button"
                  style={{ ...s.btnGhost, marginRight: 6 }}
                  onClick={() => verAnimales(j.id)}
                >
                  Ver animales
                </button>
                <button
                  type="button"
                  style={{ ...s.btnGhost, marginRight: 6 }}
                  onClick={() =>
                    setEdit({
                      id: j.id,
                      codigo: j.codigo,
                      id_area: String(j.id_area),
                      capacidad: j.capacidad_maxima != null ? String(j.capacidad_maxima) : '',
                    })
                  }
                >
                  Editar
                </button>
                <button type="button" style={s.btnDanger} onClick={() => deactivate(j)}>
                  Desactivar
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
