import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { clearDraft, loadDraft, promedioPesos, saveDraft } from '../utils/draftForm';

const DRAFT_KEY = 'draft:destetes';

const emptyForm = () => ({
  id_parto: '',
  fecha_destete: new Date().toISOString().slice(0, 10),
  destetados_m: 0,
  destetados_h: 0,
  muertos: 0,
  peso_m1: '',
  peso_m2: '',
  peso_m3: '',
  peso_h1: '',
  peso_h2: '',
  peso_h3: '',
  id_jaula_m: '',
  id_jaula_h: '',
});

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

/** CUY-09 destetes */
const Destetes = () => {
  const [lista, setLista] = useState([]);
  const [partos, setPartos] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [d, p, j] = await Promise.all([
        api.get('/destetes'),
        api.get('/partos'),
        api.get('/jaulas'),
      ]);
      setLista(d.data);
      setPartos(p.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar destetes');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    saveDraft(DRAFT_KEY, form);
  }, [form]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const previewPromedio = promedioPesos(
    form.peso_m1,
    form.peso_m2,
    form.peso_m3,
    form.peso_h1,
    form.peso_h2,
    form.peso_h3
  );

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/destetes', {
        id_parto: Number(form.id_parto),
        fecha_destete: form.fecha_destete,
        destetados_m: Number(form.destetados_m) || 0,
        destetados_h: Number(form.destetados_h) || 0,
        muertos: Number(form.muertos) || 0,
        peso_m1: numOrNull(form.peso_m1),
        peso_m2: numOrNull(form.peso_m2),
        peso_m3: numOrNull(form.peso_m3),
        peso_h1: numOrNull(form.peso_h1),
        peso_h2: numOrNull(form.peso_h2),
        peso_h3: numOrNull(form.peso_h3),
        id_jaula_m: form.id_jaula_m ? Number(form.id_jaula_m) : null,
        id_jaula_h: form.id_jaula_h ? Number(form.id_jaula_h) : null,
      });
      setOk('Destete registrado');
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  const rowPromedio = (d) =>
    promedioPesos(d.peso_m1, d.peso_m2, d.peso_m3, d.peso_h1, d.peso_h2, d.peso_h3);

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Destetes</h1>
      <p style={s.sub}>Cierre de camada y paso a recría</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <select
            style={s.select}
            required
            value={form.id_parto}
            onChange={(e) => setField('id_parto', e.target.value)}
          >
            <option value="">Parto</option>
            {partos.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} {p.hembra_codigo} ({String(p.fecha_parto).slice(0, 10)})
              </option>
            ))}
          </select>
          <input
            style={s.input}
            type="date"
            required
            value={form.fecha_destete}
            onChange={(e) => setField('fecha_destete', e.target.value)}
          />
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Destetados M"
            value={form.destetados_m}
            onChange={(e) => setField('destetados_m', e.target.value)}
          />
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Destetados H"
            value={form.destetados_h}
            onChange={(e) => setField('destetados_h', e.target.value)}
          />
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Muertos"
            value={form.muertos}
            onChange={(e) => setField('muertos', e.target.value)}
          />
        </div>
        <p style={{ margin: '0.5rem 0 0.35rem', color: '#7A6358' }}>Pesos destete (g)</p>
        <div style={s.row}>
          {['peso_m1', 'peso_m2', 'peso_m3', 'peso_h1', 'peso_h2', 'peso_h3'].map((k) => (
            <input
              key={k}
              style={s.input}
              type="number"
              step="0.01"
              min="0"
              placeholder={k.replace('peso_', '').toUpperCase()}
              value={form[k]}
              onChange={(e) => setField(k, e.target.value)}
            />
          ))}
        </div>
        <div style={s.row}>
          <select
            style={s.select}
            value={form.id_jaula_m}
            onChange={(e) => setField('id_jaula_m', e.target.value)}
          >
            <option value="">Jaula destete M (opc.)</option>
            {jaulas.map((j) => (
              <option key={j.id} value={j.id}>
                {j.area ? `${j.area} / ` : ''}
                {j.codigo}
              </option>
            ))}
          </select>
          <select
            style={s.select}
            value={form.id_jaula_h}
            onChange={(e) => setField('id_jaula_h', e.target.value)}
          >
            <option value="">Jaula destete H (opc.)</option>
            {jaulas.map((j) => (
              <option key={`h-${j.id}`} value={j.id}>
                {j.area ? `${j.area} / ` : ''}
                {j.codigo}
              </option>
            ))}
          </select>
          {previewPromedio != null && (
            <span style={{ color: '#4F0C10', fontWeight: 650 }}>
              Promedio preview: {previewPromedio} g
            </span>
          )}
          <button type="submit" style={s.btn}>
            Registrar destete
          </button>
        </div>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Hembra</th>
            <th style={s.th}>Parto</th>
            <th style={s.th}>Dest. M/H</th>
            <th style={s.th}>Muertos</th>
            <th style={s.th}>Promedio</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((d) => {
            const prom = rowPromedio(d);
            return (
              <tr key={d.id}>
                <td style={s.td}>{String(d.fecha_destete).slice(0, 10)}</td>
                <td style={s.td}>{d.hembra_codigo}</td>
                <td style={s.td}>{String(d.fecha_parto).slice(0, 10)}</td>
                <td style={s.td}>
                  {d.destetados_m}/{d.destetados_h}
                </td>
                <td style={s.td}>{d.muertos}</td>
                <td style={s.td}>{prom != null ? `${prom} g` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Destetes;
