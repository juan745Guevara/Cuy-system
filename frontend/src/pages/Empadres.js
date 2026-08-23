import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-07 · CUY-13 empadre */
const Empadres = () => {
  const [lista, setLista] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [machos, setMachos] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_macho: '',
    hembras: [],
    id_jaula: '',
    fecha_empadre: new Date().toISOString().slice(0, 10),
    peso_antes: '',
    peso_despues: '',
    notas: '',
  });

  const load = useCallback(async () => {
    try {
      const [h, m, j] = await Promise.all([
        api.get('/animales', { params: { sexo: 'H', estado: 'activo' } }),
        api.get('/animales', { params: { sexo: 'M', estado: 'activo' } }),
        api.get('/jaulas'),
      ]);
      setHembras(h.data.data || h.data);
      setMachos(m.data.data || m.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHembra = (id) => {
    setForm((f) => ({
      ...f,
      hembras: f.hembras.includes(id) ? f.hembras.filter((x) => x !== id) : [...f.hembras, id],
    }));
  };

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { data } = await api.post('/empadres', {
        id_macho: form.id_macho ? Number(form.id_macho) : null,
        hembras: form.hembras,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        fecha_empadre: form.fecha_empadre,
        peso_antes: form.peso_antes ? Number(form.peso_antes) : null,
        peso_despues: form.peso_despues ? Number(form.peso_despues) : null,
        notas: form.notas || null,
      });
      setOk(`Empadre #${data.id} registrado`);
      setLista((prev) => [data, ...prev]);
      setForm({
        ...form,
        hembras: [],
        peso_antes: '',
        peso_despues: '',
        notas: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar empadre');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Empadres</h1>
      <p style={s.sub}>Registro de servicio (hembra y/o macho)</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <input
            style={s.input}
            type="date"
            required
            value={form.fecha_empadre}
            onChange={(e) => setForm({ ...form, fecha_empadre: e.target.value })}
          />
          <select
            style={s.select}
            value={form.id_macho}
            onChange={(e) => setForm({ ...form, id_macho: e.target.value })}
          >
            <option value="">Macho (opcional)</option>
            {machos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo}
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
        </div>
        <p>Hembras:</p>
        <div style={s.row}>
          {hembras.map((a) => (
            <label key={a.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.hembras.includes(a.id)}
                onChange={() => toggleHembra(a.id)}
              />
              {a.codigo}
            </label>
          ))}
        </div>
        <div style={s.row}>
          <input
            style={s.input}
            type="number"
            step="0.01"
            placeholder="Peso antes"
            value={form.peso_antes}
            onChange={(e) => setForm({ ...form, peso_antes: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            step="0.01"
            placeholder="Peso después"
            value={form.peso_despues}
            onChange={(e) => setForm({ ...form, peso_despues: e.target.value })}
          />
          <input
            style={{ ...s.input, minWidth: 200 }}
            placeholder="Notas"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
          />
          <button type="submit" style={s.btn} disabled={form.hembras.length === 0}>
            Registrar empadre
          </button>
        </div>
      </form>

      {lista.length > 0 && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Últimos registrados en esta sesión</h3>
          <ul>
            {lista.map((e) => (
              <li key={e.id}>
                #{e.id} — {e.fecha_empadre} — hembras: {(e.hembras || []).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Empadres;
