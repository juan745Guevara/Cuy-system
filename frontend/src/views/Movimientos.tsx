'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:movimientos';

const emptyForm = () => ({
  fecha: new Date().toISOString().slice(0, 10),
  id_area_destino: '',
  id_jaula_destino: '',
  ids_animales: [],
  id_jaula_origen_completa: '',
  motivo: '',
  confirmar_capacidad: false,
  confirmar_area: false,
  id_granja_destino: '',
  id_animal_hist: '',
  id_jaula_hist: '',
  fecha_jaula: new Date().toISOString().slice(0, 10),
});

/** Traslados, historial de movimientos, avisos de capacidad/área y transfers entre granjas */
const Movimientos = () => {
  const [tab, setTab] = useState('relocate');
  const [animals, setAnimals] = useState([]);
  const [cages, setCages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [farms, setFarms] = useState([]);
  const [recent, setRecent] = useState([]);
  const [overCap, setOverCap] = useState([]);
  const [outOfArea, setOutOfArea] = useState([]);
  const [history, setHistory] = useState([]);
  const [cageOccupancy, setCageOccupancy] = useState(null);
  const [destCages, setDestCages] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [a, j, ar, m, sc, fa, g] = await Promise.all([
        api.get('/animals', { params: { estado: 'activo' } }),
        api.get('/recintos'),
        api.get('/areas'),
        api.get('/cuyes/movements'),
        api.get('/cuyes/movements/overcapacity'),
        api.get('/cuyes/movements/out-of-area'),
        api.get('/farms').catch(() => ({ data: [] })),
      ]);
      setAnimals(a.data.data || a.data);
      setCages(j.data);
      setAreas(ar.data);
      setRecent(m.data);
      setOverCap(sc.data);
      setOutOfArea(fa.data);
      setFarms(g.data.data || g.data || []);
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

  const cagesForDest = form.id_area_destino
    ? cages.filter((j) => String(j.id_area) === String(form.id_area_destino))
    : cages;

  const toggleAnimal = (id) => {
    setForm((f) => ({
      ...f,
      ids_animales: f.ids_animales.includes(id)
        ? f.ids_animales.filter((x) => x !== id)
        : [...f.ids_animales, id],
    }));
  };

  const applyConfirm = (d) => {
    if (d?.requiere_confirmacion === 'capacidad') {
      setForm((f) => ({ ...f, confirmar_capacidad: true }));
      setError(`${d.error}. Confirme capacidad y reintente.`);
      return true;
    }
    if (d?.requiere_confirmacion === 'area') {
      setForm((f) => ({ ...f, confirmar_area: true }));
      setError(`${d.error}. Indique motivo, confirme área y reintente.`);
      return true;
    }
    return false;
  };

  const submitTraslado = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { data } = await api.post('/cuyes/movements/relocate', {
        fecha: form.fecha,
        id_jaula_destino: Number(form.id_jaula_destino),
        ids_animales: form.ids_animales,
        id_jaula_origen_completa: form.id_jaula_origen_completa
          ? Number(form.id_jaula_origen_completa)
          : null,
        motivo: form.motivo || null,
        confirmar_capacidad: form.confirmar_capacidad,
        confirmar_area: form.confirmar_area,
      });
      setOk(`Trasladados: ${data.trasladados}`);
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409 && applyConfirm(d)) return;
      setError(d?.error || 'No se pudo trasladar');
    }
  };

  const submitTransferencia = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { data } = await api.post('/cuyes/movements/transfer', {
        fecha: form.fecha,
        id_granja_destino: Number(form.id_granja_destino),
        id_jaula_destino: Number(form.id_jaula_destino),
        ids_animales: form.ids_animales,
        motivo: form.motivo,
        confirmar_capacidad: form.confirmar_capacidad,
      });
      setOk(`Transferidos: ${data.transferidos}`);
      setForm((f) => ({
        ...f,
        ids_animales: [],
        confirmar_capacidad: false,
        motivo: '',
      }));
      load();
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409 && applyConfirm(d)) return;
      setError(d?.error || 'No se pudo transferir');
    }
  };

  const onDestFarm = async (id) => {
    setForm((f) => ({
      ...f,
      id_granja_destino: id,
      id_jaula_destino: '',
      confirmar_capacidad: false,
    }));
    setDestCages([]);
    if (!id) return;
    try {
      const { data } = await api.get(`/cuyes/movements/destination-cages/${id}`);
      setDestCages(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar jaulas destino');
    }
  };

  const loadHistory = async () => {
    if (!form.id_animal_hist) return;
    try {
      const { data } = await api.get(`/cuyes/movements/animal/${form.id_animal_hist}`);
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar historial');
    }
  };

  const loadCageOccupancy = async () => {
    if (!form.id_jaula_hist) return;
    try {
      const { data } = await api.get(`/cuyes/movements/cage/${form.id_jaula_hist}`, {
        params: { fecha: form.fecha_jaula },
      });
      setCageOccupancy(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar ocupación');
    }
  };

  const activeFarm = localStorage.getItem('farmId') || '';

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Movimientos</h1>
      <p style={s.sub}>Traslados internos, transfers e historial</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.row}>
        {[
          ['relocate', 'Traslado'],
          ['transfer', 'Transferencia'],
          ['historial', 'Historial'],
          ['avisos', 'Avisos'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            style={tab === k ? s.btn : s.btnGhost}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'relocate' && (
        <form onSubmit={submitTraslado} style={s.card}>
          <p style={s.sub}>Elija área y luego jaula de destino</p>
          <div style={s.row}>
            <input
              style={s.input}
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <select
              style={s.select}
              value={form.id_area_destino}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_area_destino: e.target.value,
                  id_jaula_destino: '',
                })
              }
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}{a.proposito ? ` (${a.proposito})` : ''}
                </option>
              ))}
            </select>
            <select
              style={s.select}
              required
              value={form.id_jaula_destino}
              onChange={(e) => setForm({ ...form, id_jaula_destino: e.target.value })}
            >
              <option value="">Jaula destino</option>
              {cagesForDest.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo} ({j.ocupacion}/{j.capacidad_maxima ?? '∞'})
                </option>
              ))}
            </select>
            <select
              style={s.select}
              value={form.id_jaula_origen_completa}
              onChange={(e) => setForm({ ...form, id_jaula_origen_completa: e.target.value })}
            >
              <option value="">O mover jaula completa…</option>
              {cages.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo}
                </option>
              ))}
            </select>
            <input
              style={s.input}
              placeholder={form.confirmar_area ? 'Motivo (obligatorio)' : 'Motivo (opcional)'}
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>
          <div style={{ maxHeight: 180, overflow: 'auto', marginBottom: '0.75rem' }}>
            {animals.map((a) => (
              <label key={a.id} style={{ display: 'block', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={form.ids_animales.includes(a.id)}
                  onChange={() => toggleAnimal(a.id)}
                />{' '}
                {a.codigo} ({a.sexo}) · {a.jaula || '—'}
              </label>
            ))}
          </div>
          {(form.confirmar_capacidad || form.confirmar_area) && (
            <p style={s.sub}>
              Confirme{form.confirmar_capacidad ? ' capacidad' : ''}
              {form.confirmar_area ? ' área (indique motivo)' : ''} y reintente.
            </p>
          )}
          <button type="submit" style={s.btn}>
            Registrar relocate
          </button>
        </form>
      )}

      {tab === 'transfer' && (
        <form onSubmit={submitTransferencia} style={s.card}>
          <p style={s.sub}>Misma especie · supervisor/admin</p>
          <div style={s.row}>
            <input
              style={s.input}
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <select
              style={s.select}
              required
              value={form.id_granja_destino}
              onChange={(e) => onDestFarm(e.target.value)}
            >
              <option value="">Granja destino</option>
              {farms
                .filter((g) => String(g.id) !== String(activeFarm))
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.especie || ''} · {g.nombre}
                  </option>
                ))}
            </select>
            <select
              style={s.select}
              required
              value={form.id_jaula_destino}
              onChange={(e) => setForm({ ...form, id_jaula_destino: e.target.value })}
            >
              <option value="">Jaula destino</option>
              {destCages.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo} ({j.ocupacion}/{j.capacidad_maxima ?? '∞'})
                </option>
              ))}
            </select>
            <input
              style={s.input}
              required
              placeholder="Motivo (obligatorio)"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>
          <div style={{ maxHeight: 180, overflow: 'auto', marginBottom: '0.75rem' }}>
            {animals.map((a) => (
              <label key={a.id} style={{ display: 'block', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={form.ids_animales.includes(a.id)}
                  onChange={() => toggleAnimal(a.id)}
                />{' '}
                {a.codigo}
              </label>
            ))}
          </div>
          {form.confirmar_capacidad && (
            <p style={s.sub}>Capacidad excedida: confirme reenviando el formulario.</p>
          )}
          <button type="submit" style={s.btn}>
            Transferir
          </button>
        </form>
      )}

      {tab === 'historial' && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Recorrido del animal</h3>
          <div style={s.row}>
            <select
              style={s.select}
              value={form.id_animal_hist}
              onChange={(e) => setForm({ ...form, id_animal_hist: e.target.value })}
            >
              <option value="">Animal</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo}
                </option>
              ))}
            </select>
            <button type="button" style={s.btn} onClick={loadHistory}>
              Ver historial
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Tipo</th>
                <th style={s.th}>Origen</th>
                <th style={s.th}>Destino</th>
                <th style={s.th}>Área dest.</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td style={s.td}>{String(h.fecha).slice(0, 10)}</td>
                  <td style={s.td}>{h.tipo}</td>
                  <td style={s.td}>
                    {h.granja_origen || ''} {h.jaula_origen || '—'}
                    {h.area_origen ? ` (${h.area_origen})` : ''}
                  </td>
                  <td style={s.td}>
                    {h.granja_destino || ''} {h.jaula_destino || '—'}
                  </td>
                  <td style={s.td}>{h.area_destino || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Ocupación de jaula en una fecha</h3>
          <div style={s.row}>
            <select
              style={s.select}
              value={form.id_jaula_hist}
              onChange={(e) => setForm({ ...form, id_jaula_hist: e.target.value })}
            >
              <option value="">Jaula</option>
              {cages.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo}
                </option>
              ))}
            </select>
            <input
              style={s.input}
              type="date"
              value={form.fecha_jaula}
              onChange={(e) => setForm({ ...form, fecha_jaula: e.target.value })}
            />
            <button type="button" style={s.btn} onClick={loadCageOccupancy}>
              Consultar
            </button>
          </div>
          {cageOccupancy && (
            <div>
              <p style={s.sub}>
                {cageOccupancy.jaula?.area} / {cageOccupancy.jaula?.codigo} al{' '}
                {cageOccupancy.fecha}: {(cageOccupancy.en_fecha || []).length} animal(es)
              </p>
              <ul>
                {(cageOccupancy.en_fecha || []).map((a) => (
                  <li key={a.id}>
                    {a.codigo} ({a.sexo}) {a.categoria || ''}
                  </li>
                ))}
              </ul>
              <p style={s.sub}>Hoy en la jaula: {(cageOccupancy.actuales || []).length}</p>
            </div>
          )}

          <h3>Últimos de la granja</h3>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Código</th>
                <th style={s.th}>Tipo</th>
                <th style={s.th}>De → A</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td style={s.td}>{String(m.fecha).slice(0, 10)}</td>
                  <td style={s.td}>{m.codigo}</td>
                  <td style={s.td}>{m.tipo}</td>
                  <td style={s.td}>
                    {m.jaula_origen || '—'} → {m.jaula_destino || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'avisos' && (
        <div>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>Jaulas sobre capacidad</h3>
            {overCap.length === 0 ? (
              <p>Ninguna</p>
            ) : (
              <ul>
                {overCap.map((j) => (
                  <li key={j.id}>
                    {j.area} · {j.codigo}: {j.ocupacion}/{j.capacidad_maxima}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>Animales fuera de área</h3>
            {outOfArea.length === 0 ? (
              <p>Ninguno</p>
            ) : (
              <ul>
                {outOfArea.map((a) => (
                  <li key={a.id}>
                    {a.codigo} en {a.area}/{a.jaula} (esperado: {a.proposito_area})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
