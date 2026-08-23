import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-12 registrar macho reproductor */
const Reproductores = () => {
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    codigo: '',
    id_raza: '',
    id_categoria: '',
    id_jaula: '',
    fecha_nacimiento: '',
    particularidad: '',
  });

  const load = useCallback(async () => {
    try {
      const [r, c, j, a] = await Promise.all([
        api.get('/catalogos/razas'),
        api.get('/catalogos/categorias'),
        api.get('/jaulas'),
        api.get('/animales', { params: { sexo: 'M', estado: 'activo' } }),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
      setJaulas(j.data);
      setLista(a.data.data || a.data);
      const catRep = (c.data || []).find((x) =>
        String(x.nombre).toLowerCase() === 'reproductor'
      );
      if (catRep) {
        setForm((f) => ({ ...f, id_categoria: f.id_categoria || String(catRep.id) }));
      }
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
      await api.post('/empadres/reproductores', {
        codigo: form.codigo,
        id_raza: form.id_raza ? Number(form.id_raza) : null,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        particularidad: form.particularidad || null,
      });
      setOk(`Reproductor ${form.codigo} registrado`);
      setForm((f) => ({
        ...f,
        codigo: '',
        id_jaula: '',
        fecha_nacimiento: '',
        particularidad: '',
      }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Reproductores</h1>
      <p style={s.sub}>Alta de machos para el ciclo de empadre</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <input
          style={s.input}
          required
          placeholder="Código (ej. UM01)"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />
        <select
          style={s.select}
          value={form.id_raza}
          onChange={(e) => setForm({ ...form, id_raza: e.target.value })}
        >
          <option value="">Raza</option>
          {razas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={form.id_categoria}
          onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
        >
          <option value="">Categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={form.id_jaula}
          onChange={(e) => setForm({ ...form, id_jaula: e.target.value })}
        >
          <option value="">Jaula</option>
          {jaulas.map((j) => (
            <option key={j.id} value={j.id}>
              {j.codigo}
            </option>
          ))}
        </select>
        <input
          style={s.input}
          type="date"
          value={form.fecha_nacimiento}
          onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
        />
        <input
          style={{ ...s.input, minWidth: 180 }}
          placeholder="Particularidad"
          value={form.particularidad}
          onChange={(e) => setForm({ ...form, particularidad: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar macho
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Código</th>
            <th style={s.th}>Nacimiento</th>
            <th style={s.th}>Jaula</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((a) => (
            <tr key={a.id}>
              <td style={s.td}>{a.codigo}</td>
              <td style={s.td}>{a.fecha_nacimiento || '—'}</td>
              <td style={s.td}>{a.jaula_codigo || a.id_jaula || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reproductores;
