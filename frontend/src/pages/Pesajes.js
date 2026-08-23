import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-21 individual · NUC-22 lote · NUC-23 evolución · CUY-16 rangos */
const Pesajes = () => {
  const [tab, setTab] = useState('individual');
  const [animales, setAnimales] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [promedio, setPromedio] = useState([]);
  const [rangos, setRangos] = useState(null);
  const [loteAnimales, setLoteAnimales] = useState([]);
  const [pesosLote, setPesosLote] = useState({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [form, setForm] = useState({
    id_animal: '',
    fecha: new Date().toISOString().slice(0, 10),
    peso_gramos: '',
    id_jaula: '',
  });

  const load = useCallback(async () => {
    try {
      const [a, j, r] = await Promise.all([
        api.get('/animales', { params: { estado: 'activo' } }),
        api.get('/jaulas'),
        api.get('/pesajes/rangos').catch(() => ({ data: null })),
      ]);
      setAnimales(a.data.data || a.data);
      setJaulas(j.data);
      setRangos(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/pesajes', {
        id_animal: Number(form.id_animal),
        fecha: form.fecha,
        peso_gramos: Number(form.peso_gramos),
        confirmar_fuera_rango: confirmar,
      });
      setOk('Peso registrado');
      setConfirmar(false);
      setForm((f) => ({ ...f, peso_gramos: '' }));
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409) {
        setError(`${d.error}. Confirme si el valor es correcto.`);
        setConfirmar(true);
      } else {
        setError(d?.error || 'No se pudo registrar');
      }
    }
  };

  const cargarJaula = async () => {
    if (!form.id_jaula) return;
    try {
      const { data } = await api.get(`/jaulas/${form.id_jaula}/animales`);
      setLoteAnimales(data);
      setPesosLote({});
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo listar la jaula');
    }
  };

  const guardarLote = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const pesajes = Object.entries(pesosLote)
      .filter(([, w]) => w !== '' && w != null)
      .map(([id, w]) => ({ id_animal: Number(id), peso_gramos: Number(w) }));
    try {
      const { data } = await api.post('/pesajes/lote', {
        fecha: form.fecha,
        pesajes,
        confirmar_fuera_rango: confirmar,
      });
      setOk(`Registrados: ${data.registrados}`);
      setConfirmar(false);
      setPesosLote({});
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409) {
        setError(`${d.error}. Confirme y reintente.`);
        setConfirmar(true);
      } else {
        setError(d?.error || 'No se pudo guardar el lote');
      }
    }
  };

  const verEvolucion = async () => {
    if (!form.id_animal) return;
    try {
      const { data } = await api.get(`/pesajes/animal/${form.id_animal}`);
      setHistorial(data);
      setPromedio([]);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar evolución');
    }
  };

  const verPromedio = async () => {
    if (!form.id_jaula) return;
    try {
      const { data } = await api.get('/pesajes/promedio', {
        params: { id_jaula: form.id_jaula },
      });
      setPromedio(data);
      setHistorial([]);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar promedio');
    }
  };

  const maxPeso = Math.max(
    ...historial.map((h) => Number(h.peso_gramos) || 0),
    ...promedio.map((p) => Number(p.promedio) || 0),
    1
  );

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Pesajes</h1>
      <p style={s.sub}>Registro individual, por lote y evolución (gramos)</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.row}>
        {['individual', 'lote', 'evolucion'].map((t) => (
          <button
            key={t}
            type="button"
            style={tab === t ? s.btn : s.btnGhost}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'individual' && (
        <form onSubmit={registrar} style={{ ...s.card, ...s.row }}>
          {rangos?.especie && (
            <p style={{ ...s.sub, width: '100%', marginBottom: 0 }}>
              Unidad: gramos · especie {rangos.especie.min}-{rangos.especie.max} g (CUY-16)
            </p>
          )}
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
            value={form.id_animal}
            onChange={(e) => setForm({ ...form, id_animal: e.target.value })}
          >
            <option value="">Animal</option>
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
            step="0.1"
            required
            placeholder="Peso (g)"
            value={form.peso_gramos}
            onChange={(e) => setForm({ ...form, peso_gramos: e.target.value })}
          />
          <button type="submit" style={s.btn}>
            Registrar
          </button>
        </form>
      )}

      {tab === 'lote' && (
        <form onSubmit={guardarLote} style={s.card}>
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
              value={form.id_jaula}
              onChange={(e) => setForm({ ...form, id_jaula: e.target.value })}
            >
              <option value="">Jaula</option>
              {jaulas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo}
                </option>
              ))}
            </select>
            <button type="button" style={s.btnGhost} onClick={cargarJaula}>
              Listar animales
            </button>
            <button type="submit" style={s.btn}>
              Guardar pesos
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Código</th>
                <th style={s.th}>Peso (g)</th>
              </tr>
            </thead>
            <tbody>
              {loteAnimales.map((a) => (
                <tr key={a.id}>
                  <td style={s.td}>{a.codigo}</td>
                  <td style={s.td}>
                    <input
                      style={s.input}
                      type="number"
                      min="1"
                      step="0.1"
                      value={pesosLote[a.id] || ''}
                      onChange={(e) =>
                        setPesosLote({ ...pesosLote, [a.id]: e.target.value })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      )}

      {tab === 'evolucion' && (
        <div style={s.card}>
          <div style={s.row}>
            <select
              style={s.select}
              value={form.id_animal}
              onChange={(e) => setForm({ ...form, id_animal: e.target.value })}
            >
              <option value="">Animal</option>
              {animales.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo}
                </option>
              ))}
            </select>
            <button type="button" style={s.btn} onClick={verEvolucion}>
              Ver evolución
            </button>
            <select
              style={s.select}
              value={form.id_jaula}
              onChange={(e) => setForm({ ...form, id_jaula: e.target.value })}
            >
              <option value="">Jaula (promedio)</option>
              {jaulas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.area} · {j.codigo}
                </option>
              ))}
            </select>
            <button type="button" style={s.btnGhost} onClick={verPromedio}>
              Promedio grupo
            </button>
          </div>
          {(historial.length > 0 || promedio.length > 0) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 6,
                height: 120,
                margin: '1rem 0',
              }}
            >
              {(historial.length ? historial : promedio).map((h, i) => (
                <div
                  key={h.id || `${h.fecha}-${i}`}
                  title={`${h.fecha}: ${h.peso_gramos ?? h.promedio}g`}
                  style={{
                    width: 18,
                    height: `${(Number(h.peso_gramos ?? h.promedio) / maxPeso) * 100}%`,
                    background: '#7A1216',
                    minHeight: 4,
                  }}
                />
              ))}
            </div>
          )}
          {historial.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Peso (g)</th>
                  <th style={s.th}>Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id}>
                    <td style={s.td}>{String(h.fecha).slice(0, 10)}</td>
                    <td style={s.td}>{h.peso_gramos}</td>
                    <td style={s.td}>{h.ganancia_gramos ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {promedio.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Promedio (g)</th>
                  <th style={s.th}>N</th>
                </tr>
              </thead>
              <tbody>
                {promedio.map((p) => (
                  <tr key={p.fecha}>
                    <td style={s.td}>{String(p.fecha).slice(0, 10)}</td>
                    <td style={s.td}>{p.promedio}</td>
                    <td style={s.td}>{p.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Pesajes;
