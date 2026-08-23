import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-14 traslado · NUC-15 historial · NUC-18/19 avisos · NUC-20 transferencia */
const Movimientos = () => {
  const [tab, setTab] = useState('traslado');
  const [animales, setAnimales] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [lista, setLista] = useState([]);
  const [sobrecupo, setSobrecupo] = useState([]);
  const [fueraArea, setFueraArea] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ocupJaula, setOcupJaula] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
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

  const load = useCallback(async () => {
    try {
      const [a, j, ar, m, sc, fa, g] = await Promise.all([
        api.get('/animales', { params: { estado: 'activo' } }),
        api.get('/jaulas'),
        api.get('/areas'),
        api.get('/movimientos'),
        api.get('/movimientos/sobrecupo'),
        api.get('/movimientos/fuera-de-area'),
        api.get('/granjas').catch(() => ({ data: [] })),
      ]);
      setAnimales(a.data.data || a.data);
      setJaulas(j.data);
      setAreas(ar.data);
      setLista(m.data);
      setSobrecupo(sc.data);
      setFueraArea(fa.data);
      setGranjas(g.data.data || g.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  const jaulasDestino = form.id_area_destino
    ? jaulas.filter((j) => String(j.id_area) === String(form.id_area_destino))
    : jaulas;

  useEffect(() => {
    load();
  }, [load]);

  const toggleAnimal = (id) => {
    setForm((f) => ({
      ...f,
      ids_animales: f.ids_animales.includes(id)
        ? f.ids_animales.filter((x) => x !== id)
        : [...f.ids_animales, id],
    }));
  };

  const enviarTraslado = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { data } = await api.post('/movimientos/traslado', {
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
      setForm((f) => ({
        ...f,
        ids_animales: [],
        confirmar_capacidad: false,
        confirmar_area: false,
      }));
      load();
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409 && d?.requiere_confirmacion) {
        setError(`${d.error}. Confirme y reintente.`);
        if (d.requiere_confirmacion === 'capacidad') {
          setForm((f) => ({ ...f, confirmar_capacidad: true }));
        }
        if (d.requiere_confirmacion === 'area') {
          setForm((f) => ({ ...f, confirmar_area: true }));
        }
      } else {
        setError(d?.error || 'No se pudo trasladar');
      }
    }
  };

  const enviarTransferencia = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { data } = await api.post('/movimientos/transferencia', {
        fecha: form.fecha,
        id_granja_destino: Number(form.id_granja_destino),
        id_jaula_destino: Number(form.id_jaula_destino),
        ids_animales: form.ids_animales,
        motivo: form.motivo || null,
      });
      setOk(`Transferidos: ${data.transferidos}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo transferir');
    }
  };

  const verHistorial = async () => {
    if (!form.id_animal_hist) return;
    try {
      const { data } = await api.get(`/movimientos/animal/${form.id_animal_hist}`);
      setHistorial(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar historial');
    }
  };

  const verOcupacionJaula = async () => {
    if (!form.id_jaula_hist) return;
    try {
      const { data } = await api.get(`/movimientos/jaula/${form.id_jaula_hist}`, {
        params: { fecha: form.fecha_jaula },
      });
      setOcupJaula(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar ocupación');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Movimientos</h1>
      <p style={s.sub}>Traslados internos, transferencias e historial</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.row}>
        {[
          ['traslado', 'Traslado'],
          ['transferencia', 'Transferencia'],
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

      {tab === 'traslado' && (
        <form onSubmit={enviarTraslado} style={s.card}>
          <p style={s.sub}>Elija área y luego jaula de destino (NUC-14)</p>
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
                  {a.nombre} ({a.proposito})
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
              {jaulasDestino.map((j) => (
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
              {jaulas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo}
                </option>
              ))}
            </select>
            <input
              style={s.input}
              placeholder="Motivo (opcional)"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>
          <div style={{ maxHeight: 180, overflow: 'auto', marginBottom: '0.75rem' }}>
            {animales.map((a) => (
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
          <button type="submit" style={s.btn}>
            Registrar traslado
          </button>
        </form>
      )}

      {tab === 'transferencia' && (
        <form onSubmit={enviarTransferencia} style={s.card}>
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
              onChange={(e) => setForm({ ...form, id_granja_destino: e.target.value })}
            >
              <option value="">Granja destino</option>
              {granjas.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.especie || ''} · {g.nombre}
                </option>
              ))}
            </select>
            <input
              style={s.input}
              type="number"
              required
              placeholder="ID jaula destino"
              value={form.id_jaula_destino}
              onChange={(e) => setForm({ ...form, id_jaula_destino: e.target.value })}
            />
          </div>
          <div style={{ maxHeight: 180, overflow: 'auto', marginBottom: '0.75rem' }}>
            {animales.map((a) => (
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
          <button type="submit" style={s.btn}>
            Transferir
          </button>
        </form>
      )}

      {tab === 'historial' && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Recorrido del animal (NUC-15)</h3>
          <div style={s.row}>
            <select
              style={s.select}
              value={form.id_animal_hist}
              onChange={(e) => setForm({ ...form, id_animal_hist: e.target.value })}
            >
              <option value="">Animal</option>
              {animales.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo}
                </option>
              ))}
            </select>
            <button type="button" style={s.btn} onClick={verHistorial}>
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
              {historial.map((h) => (
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
              {jaulas.map((j) => (
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
            <button type="button" style={s.btn} onClick={verOcupacionJaula}>
              Consultar
            </button>
          </div>
          {ocupJaula && (
            <div>
              <p style={s.sub}>
                {ocupJaula.jaula?.area} / {ocupJaula.jaula?.codigo} al {ocupJaula.fecha}:{' '}
                {(ocupJaula.en_fecha || []).length} animal(es)
              </p>
              <ul>
                {(ocupJaula.en_fecha || []).map((a) => (
                  <li key={a.id}>
                    {a.codigo} ({a.sexo}) {a.categoria || ''}
                  </li>
                ))}
              </ul>
              <p style={s.sub}>Hoy en la jaula: {(ocupJaula.actuales || []).length}</p>
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
              {lista.map((m) => (
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
            <h3 style={{ marginTop: 0 }}>Jaulas sobre capacidad (NUC-18)</h3>
            {sobrecupo.length === 0 ? (
              <p>Ninguna</p>
            ) : (
              <ul>
                {sobrecupo.map((j) => (
                  <li key={j.id}>
                    {j.area} · {j.codigo}: {j.ocupacion}/{j.capacidad_maxima}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>Animales fuera de área (NUC-19)</h3>
            {fueraArea.length === 0 ? (
              <p>Ninguno</p>
            ) : (
              <ul>
                {fueraArea.map((a) => (
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
