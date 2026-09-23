import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { clearDraft, loadDraft, saveDraft } from '../utils/draftForm';

const DRAFT_KEY = 'draft:mortalidad';

const emptyForm = () => ({
  id_animal: '',
  fecha: new Date().toISOString().slice(0, 10),
  clasificacion: '',
  categoria: '',
  cantidad: 1,
  causa: '',
  id_jaula: '',
});

/** Mortalidad y bajas */
const Mortalidad = () => {
  const [lista, setLista] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [razas, setRazas] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [m, a, c, r, j] = await Promise.all([
        api.get('/mortality'),
        api.get('/animals', { params: { estado: 'activo' } }),
        api.get('/catalogs/categories'),
        api.get('/catalogs/breeds'),
        api.get('/cages'),
      ]);
      setLista(m.data);
      setAnimales(a.data.data || a.data);
      setCategorias(c.data);
      setRazas(r.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    saveDraft(DRAFT_KEY, form);
  }, [form]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const cantidad = Number(form.cantidad);
    if (!cantidad || cantidad < 1) {
      setError('Cantidad mínima: 1');
      return;
    }
    try {
      await api.post('/mortality', {
        fecha: form.fecha,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        clasificacion: form.clasificacion || null,
        categoria: form.categoria || null,
        cantidad,
        causa: form.causa || null,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
      });
      setOk('Mortalidad registrada');
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || data?.message || 'No se pudo registrar (revise tope de población)');
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
        <select
          style={s.select}
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          <option value="">Categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={form.clasificacion}
          onChange={(e) => setForm({ ...form, clasificacion: e.target.value })}
        >
          <option value="">Clasificación / raza</option>
          {razas.map((r) => (
            <option key={r.id} value={r.nombre}>
              {r.nombre}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={form.id_jaula}
          onChange={(e) => setForm({ ...form, id_jaula: e.target.value })}
        >
          <option value="">Jaula (opc.)</option>
          {jaulas.map((j) => (
            <option key={j.id} value={j.id}>
              {j.area ? `${j.area} / ` : ''}
              {j.codigo}
            </option>
          ))}
        </select>
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
            <th style={s.th}>Categoría</th>
            <th style={s.th}>Clasificación</th>
            <th style={s.th}>Causa</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((m) => (
            <tr key={m.id}>
              <td style={s.td}>{String(m.fecha).slice(0, 10)}</td>
              <td style={s.td}>{m.cantidad}</td>
              <td style={s.td}>{m.categoria || '—'}</td>
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
