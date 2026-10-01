'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, promedioPesos, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:partos';

const emptyForm = () => ({
  id_hembra: '',
  id_empadre: '',
  fecha_parto: new Date().toISOString().slice(0, 10),
  vivos_m: 0,
  vivos_h: 0,
  muertos: 0,
  peso_m1: '',
  peso_m2: '',
  peso_m3: '',
  peso_h1: '',
  peso_h2: '',
  peso_h3: '',
});

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

/** Partos y camadas */
const Partos = () => {
  const [lista, setLista] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        api.get('/cuyes/births'),
        api.get('/cuyes/animals', { params: { sexo: 'H', estado: 'activo' } }),
      ]);
      setLista(p.data);
      setHembras(h.data.data || h.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar partos');
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
    const vivosM = Number(form.vivos_m) || 0;
    const vivosH = Number(form.vivos_h) || 0;
    const muertos = Number(form.muertos) || 0;
    if (muertos > vivosM + vivosH) {
      setError('Muertos no puede superar vivos M + vivos H');
      return;
    }
    try {
      await api.post('/cuyes/births', {
        id_hembra: Number(form.id_hembra),
        id_empadre: form.id_empadre ? Number(form.id_empadre) : null,
        fecha_parto: form.fecha_parto,
        vivos_m: vivosM,
        vivos_h: vivosH,
        muertos,
        peso_m1: numOrNull(form.peso_m1),
        peso_m2: numOrNull(form.peso_m2),
        peso_m3: numOrNull(form.peso_m3),
        peso_h1: numOrNull(form.peso_h1),
        peso_h2: numOrNull(form.peso_h2),
        peso_h3: numOrNull(form.peso_h3),
      });
      setOk('Parto registrado');
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el parto');
    }
  };

  const rowPromedio = (p) =>
    promedioPesos(p.peso_m1, p.peso_m2, p.peso_m3, p.peso_h1, p.peso_h2, p.peso_h3);

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Partos</h1>
      <p style={s.sub}>Registro de camada al nacimiento (pesos y promedio)</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <select
            style={s.select}
            required
            value={form.id_hembra}
            onChange={(e) => setField('id_hembra', e.target.value)}
          >
            <option value="">Hembra</option>
            {hembras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo}
              </option>
            ))}
          </select>
          <input
            style={s.input}
            type="date"
            required
            value={form.fecha_parto}
            onChange={(e) => setField('fecha_parto', e.target.value)}
          />
          <input
            style={s.input}
            placeholder="ID empadre (opc.)"
            value={form.id_empadre}
            onChange={(e) => setField('id_empadre', e.target.value)}
          />
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Vivos M"
            value={form.vivos_m}
            onChange={(e) => setField('vivos_m', e.target.value)}
          />
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Vivos H"
            value={form.vivos_h}
            onChange={(e) => setField('vivos_h', e.target.value)}
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
        <p style={{ margin: '0.5rem 0 0.35rem', color: '#7A6358' }}>Pesos nacimiento (g) — machos</p>
        <div style={s.row}>
          {['peso_m1', 'peso_m2', 'peso_m3'].map((k, i) => (
            <input
              key={k}
              style={s.input}
              type="number"
              step="0.01"
              min="0"
              placeholder={`M${i + 1}`}
              value={form[k]}
              onChange={(e) => setField(k, e.target.value)}
            />
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0.35rem', color: '#7A6358' }}>Pesos nacimiento (g) — hembras</p>
        <div style={s.row}>
          {['peso_h1', 'peso_h2', 'peso_h3'].map((k, i) => (
            <input
              key={k}
              style={s.input}
              type="number"
              step="0.01"
              min="0"
              placeholder={`H${i + 1}`}
              value={form[k]}
              onChange={(e) => setField(k, e.target.value)}
            />
          ))}
          {previewPromedio != null && (
            <span style={{ color: '#4F0C10', fontWeight: 650 }}>
              Promedio preview: {previewPromedio} g
            </span>
          )}
          <button type="submit" style={s.btn}>
            Registrar parto
          </button>
        </div>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Hembra</th>
            <th style={s.th}>Vivos M/H</th>
            <th style={s.th}>Muertos</th>
            <th style={s.th}>Pesos M</th>
            <th style={s.th}>Pesos H</th>
            <th style={s.th}>Promedio</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => {
            const prom = rowPromedio(p);
            const pesM = [p.peso_m1, p.peso_m2, p.peso_m3].filter((x) => x != null).join(', ');
            const pesH = [p.peso_h1, p.peso_h2, p.peso_h3].filter((x) => x != null).join(', ');
            return (
              <tr key={p.id}>
                <td style={s.td}>{String(p.fecha_parto).slice(0, 10)}</td>
                <td style={s.td}>{p.hembra_codigo}</td>
                <td style={s.td}>
                  {p.vivos_m}/{p.vivos_h}
                </td>
                <td style={s.td}>{p.muertos}</td>
                <td style={s.td}>{pesM || '—'}</td>
                <td style={s.td}>{pesH || '—'}</td>
                <td style={s.td}>{prom != null ? `${prom} g` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Partos;
