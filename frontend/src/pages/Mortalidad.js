import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-26 mortalidad */
const Mortalidad = () => {
  const [lista, setLista] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_animal: '',
    fecha: new Date().toISOString().slice(0, 10),
    clasificacion: 'adulto',
    categoria: '',
    cantidad: 1,
    causa: '',
  });

  const load = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([
        api.get('/mortalidad'),
        api.get('/animales', { params: { estado: 'activo' } }),
      ]);
      setLista(m.data);
      setAnimales(a.data.data || a.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
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
      await api.post('/mortalidad', {
        ...form,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        cantidad: Number(form.cantidad),
      });
      setOk('Mortalidad registrada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Mortalidad</h1>
      <p style={s.sub}>Registro de bajas por muerte</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <input
          style={s.input}
          type="date"
          required
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
        />
        <select
          style={s.select}
          value={form.id_animal}
          onChange={(e) => setForm({ ...form, id_animal: e.target.value })}
        >
          <option value="">Animal (opc. si es lote)</option>
          {animales.map((a) => (
            <option key={a.id} value={a.id}>
              {a.codigo}
            </option>
          ))}
        </select>
        <input
          style={s.input}
          type="number"
          min="1"
          required
          value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="Clasificación"
          value={form.clasificacion}
          onChange={(e) => setForm({ ...form, clasificacion: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="Causa"
          value={form.causa}
          onChange={(e) => setForm({ ...form, causa: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Cantidad</th>
            <th style={s.th}>Clasificación</th>
            <th style={s.th}>Causa</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((m) => (
            <tr key={m.id}>
              <td style={s.td}>{String(m.fecha).slice(0, 10)}</td>
              <td style={s.td}>{m.cantidad}</td>
              <td style={s.td}>{m.clasificacion || '—'}</td>
              <td style={s.td}>{m.causa || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Mortalidad;
