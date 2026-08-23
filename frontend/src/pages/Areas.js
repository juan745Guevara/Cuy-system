import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-16 definir áreas · NUC-17 ver granja por áreas · CUY-04 */
const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [nombre, setNombre] = useState('');
  const [proposito, setProposito] = useState('empadre');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [a, r] = await Promise.all([api.get('/areas'), api.get('/areas/resumen')]);
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
    try {
      await api.post('/areas', { nombre, proposito });
      setOk(`Área "${nombre}" creada`);
      setNombre('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el área');
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
          <option value="empadre">Empadre</option>
          <option value="maternidad">Maternidad</option>
          <option value="recria">Recría</option>
          <option value="machos">Machos</option>
          <option value="engorde">Engorde</option>
          <option value="cuarentena">Cuarentena</option>
        </select>
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
          </tr>
        </thead>
        <tbody>
          {areas.map((a) => (
            <tr key={a.id}>
              <td style={s.td}>{a.nombre}</td>
              <td style={s.td}>{a.proposito}</td>
              <td style={s.td}>{a.jaulas}</td>
              <td style={s.td}>{a.animales}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem', color: '#1b4332' }}>Vista por áreas</h2>
      {resumen.map((a) => (
        <div key={a.id} style={s.card}>
          <strong>
            {a.nombre} ({a.proposito})
          </strong>
          <ul>
            {(a.jaulas || []).map((j) => (
              <li key={j.id}>
                Jaula {j.codigo}: {j.ocupacion}
                {j.capacidad_maxima != null ? ` / ${j.capacidad_maxima}` : ''} animales
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Areas;
