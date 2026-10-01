'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:sanidad';

const emptyForm = () => ({
  tipo: 'curativo',
  producto: '',
  dosis: '',
  via: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  duracion_dias: 3,
  diagnostico: '',
  responsable: '',
  id_animal: '',
  id_jaula: '',
  id_area: '',
});

/** Registrar tratamientos · historial sanitario */
const Sanidad = () => {
  const [lista, setLista] = useState([]);
  const [enCurso, setEnCurso] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [areas, setAreas] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const paramsCurso = filtroArea ? { id_area: filtroArea } : {};
      const [t, c, a, ar, j] = await Promise.all([
        api.get('/cuyes/treatments'),
        api.get('/cuyes/treatments/in-progress', { params: paramsCurso }),
        api.get('/cuyes/animals', { params: { estado: 'activo' } }),
        api.get('/areas'),
        api.get('/recintos'),
      ]);
      setLista(t.data);
      setEnCurso(c.data);
      setAnimales(a.data.data || a.data);
      setAreas(ar.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, [filtroArea]);

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
    try {
      const { data } = await api.post('/cuyes/treatments', {
        ...form,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        id_area: form.id_area ? Number(form.id_area) : null,
        duracion_dias: Number(form.duracion_dias),
      });
      setOk(`Tratamientos registrados: ${data.registrados}`);
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  const complete = async (id) => {
    const motivo = window.prompt('Motivo de cierre (opcional)') || '';
    try {
      await api.patch(`/cuyes/treatments/${id}/complete`, { motivo_cierre: motivo });
      setOk('Tratamiento cerrado');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cerrar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Sanidad</h1>
      <p style={s.sub}>Tratamientos preventivos y curativos</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <select
            style={s.select}
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="preventivo">Preventivo</option>
            <option value="curativo">Curativo</option>
          </select>
          <input
            style={s.input}
            required
            placeholder="Producto"
            value={form.producto}
            onChange={(e) => setForm({ ...form, producto: e.target.value })}
          />
          <input
            style={s.input}
            placeholder="Dosis"
            value={form.dosis}
            onChange={(e) => setForm({ ...form, dosis: e.target.value })}
          />
          <input
            style={s.input}
            placeholder="Vía"
            value={form.via}
            onChange={(e) => setForm({ ...form, via: e.target.value })}
          />
          <input
            style={s.input}
            type="date"
            required
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            min="1"
            required
            placeholder="Días"
            value={form.duracion_dias}
            onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
          />
        </div>
        <div style={s.row}>
          <select
            style={s.select}
            value={form.id_animal}
            onChange={(e) => setForm({ ...form, id_animal: e.target.value })}
          >
            <option value="">Animal (opc.)</option>
            {animales.map((a) => (
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
            <option value="">Jaula completa (opc.)</option>
            {jaulas.map((j) => (
              <option key={j.id} value={j.id}>
                {j.codigo}
              </option>
            ))}
          </select>
          <select
            style={s.select}
            value={form.id_area}
            onChange={(e) => setForm({ ...form, id_area: e.target.value })}
          >
            <option value="">Área completa (opc.)</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <input
            style={s.input}
            placeholder="Diagnóstico / motivo"
            value={form.diagnostico}
            onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
          />
          <button type="submit" style={s.btn}>
            Registrar
          </button>
        </div>
      </form>

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>En curso</h3>
        <div style={s.row}>
          <select
            style={s.select}
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Producto</th>
              <th style={s.th}>Animal</th>
              <th style={s.th}>Área</th>
              <th style={s.th}>Inicio</th>
              <th style={s.th}>Término</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {enCurso.map((t) => (
              <tr key={t.id}>
                <td style={s.td}>{t.producto}</td>
                <td style={s.td}>{t.codigo || 'grupo'}</td>
                <td style={s.td}>{t.area || '—'}</td>
                <td style={s.td}>{String(t.fecha_inicio).slice(0, 10)}</td>
                <td style={s.td}>{String(t.fecha_termino).slice(0, 10)}</td>
                <td style={s.td}>
                  <button type="button" style={s.btnDanger} onClick={() => complete(t.id)}>
                    Terminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Historial</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Tipo</th>
            <th style={s.th}>Producto</th>
            <th style={s.th}>Estado</th>
            <th style={s.th}>Inicio</th>
            <th style={s.th}>Término</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((t) => (
            <tr key={t.id}>
              <td style={s.td}>{t.tipo}</td>
              <td style={s.td}>{t.producto}</td>
              <td style={s.td}>{t.estado}</td>
              <td style={s.td}>{String(t.fecha_inicio).slice(0, 10)}</td>
              <td style={s.td}>{String(t.fecha_termino).slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Sanidad;
