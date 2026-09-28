'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

const PROPOSITOS = [
  { value: 'empadre', label: 'Empadre' },
  { value: 'gestacion_maternidad', label: 'Gestación / maternidad' },
  { value: 'recria_hembras', label: 'Recría hembras' },
  { value: 'recria_machos', label: 'Recría machos' },
  { value: 'reproductores_machos', label: 'Reproductores machos' },
  { value: 'engorde_descarte', label: 'Engorde / descarte' },
  { value: 'cuarentena', label: 'Cuarentena' },
  { value: 'otro', label: 'Otro' },
];

/** Definir áreas, ver la granja por áreas */
const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [nombre, setNombre] = useState('');
  const [proposito, setProposito] = useState('empadre');
  const [propositoOtro, setPropositoOtro] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [a, r] = await Promise.all([api.get('/cuyes/areas'), api.get('/cuyes/areas/summary')]);
      setAreas(a.data);
      setResumen(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar áreas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const prop =
      proposito === 'otro' ? (propositoOtro.trim() || 'otro') : proposito;
    try {
      await api.post('/cuyes/areas', { nombre, proposito: prop });
      setOk(`Área "${nombre}" creada`);
      setNombre('');
      setPropositoOtro('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el área');
    }
  };

  const deactivate = async (id, nom) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/cuyes/areas/${id}/deactivate`);
      setOk(`Área "${nom}" desactivada`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo deactivate el área');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Áreas de la granja</h1>
      <p style={s.sub}>Organización espacial y ocupación por área</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <input
          style={s.input}
          required
          placeholder="Nombre del área"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <select style={s.select} value={proposito} onChange={(e) => setProposito(e.target.value)}>
          {PROPOSITOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {proposito === 'otro' && (
          <input
            style={s.input}
            required
            placeholder="Propósito personalizado"
            value={propositoOtro}
            onChange={(e) => setPropositoOtro(e.target.value)}
          />
        )}
        <button type="submit" style={s.btn}>
          Crear área
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Área</th>
            <th style={s.th}>Propósito</th>
            <th style={s.th}>Jaulas</th>
            <th style={s.th}>Animales</th>
            <th style={s.th}>Estado</th>
            <th style={s.th} />
          </tr>
        </thead>
        <tbody>
          {areas.map((a) => (
            <tr key={a.id}>
              <td style={s.td}>{a.nombre}</td>
              <td style={s.td}>{a.proposito}</td>
              <td style={s.td}>{a.jaulas}</td>
              <td style={s.td}>{a.animales}</td>
              <td style={s.td}>{a.activa === false ? 'Inactiva' : 'Activa'}</td>
              <td style={s.td}>
                {a.activa !== false && (
                  <button type="button" style={s.btnDanger} onClick={() => deactivate(a.id, a.nombre)}>
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem', color: '#7A1216' }}>Vista por áreas</h2>
      {resumen.map((a) => (
        <div key={a.id} style={s.card}>
          <strong>
            {a.nombre} ({a.proposito})
          </strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
            {(a.jaulas || []).map((j) => {
              const vacia = Number(j.ocupacion) === 0;
              return (
                <li
                  key={j.id}
                  style={{
                    padding: '0.45rem 0.7rem',
                    marginBottom: 6,
                    borderRadius: 8,
                    background: vacia ? '#EFE8DA' : '#FFFCFA',
                    border: `1px solid ${vacia ? '#C4B59A' : '#E0D3BF'}`,
                    color: vacia ? '#7A6358' : '#2C181A',
                  }}
                >
                  Jaula {j.codigo}:{' '}
                  <strong>{vacia ? 'vacía' : `${j.ocupacion} ocupada(s)`}</strong>
                  {j.capacidad_maxima != null ? ` / ${j.capacidad_maxima}` : ''}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Areas;
