import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/**
 * UI Entrega 1 — ficha de animal
 * NUC-09 registrar · NUC-10 actualizar · NUC-11 buscar · NUC-12 listar/filtrar
 * NUC-38/39/40 validación y códigos únicos
 */
const Animales = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [sexo, setSexo] = useState('');
  const [estado, setEstado] = useState('activo');
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({
    codigo: '',
    sexo: 'H',
    id_raza: '',
    id_categoria: '',
    id_jaula: '',
    fecha_nacimiento: '',
    particularidad: '',
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const params = { estado };
      if (q.trim()) params.q = q.trim();
      if (sexo) params.sexo = sexo;
      const { data } = await api.get('/animales', { params });
      setItems(data.data || data);
      setTotal(data.total ?? (data.data || data).length);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar animales');
    }
  }, [q, sexo, estado]);

  const loadCatalogs = useCallback(async () => {
    try {
      const [r, c, j] = await Promise.all([
        api.get('/catalogos/razas'),
        api.get('/catalogos/categorias'),
        api.get('/jaulas'),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
      setJaulas(j.data);
    } catch {
      /* catálogos opcionales al inicio */
    }
  }, []);

  useEffect(() => {
    load();
    loadCatalogs();
  }, [load, loadCatalogs]);

  const buscarCodigo = async () => {
    if (!q.trim()) return load();
    setError('');
    setDetalle(null);
    try {
      const { data } = await api.get(`/animales/buscar/${encodeURIComponent(q.trim())}`);
      setItems([data]);
      setTotal(1);
      setDetalle(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No encontrado');
      setItems([]);
      setTotal(0);
    }
  };

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/animales', {
        ...form,
        id_raza: form.id_raza || null,
        id_categoria: form.id_categoria || null,
        id_jaula: form.id_jaula || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        particularidad: form.particularidad || null,
      });
      setOk(`Animal ${form.codigo} registrado`);
      setShowForm(false);
      setForm({
        codigo: '',
        sexo: 'H',
        id_raza: '',
        id_categoria: '',
        id_jaula: '',
        fecha_nacimiento: '',
        particularidad: '',
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    setError('');
    try {
      await api.patch(`/animales/${id}`, {
        estado: nuevoEstado,
        fecha_baja: nuevoEstado.startsWith('baja') ? new Date().toISOString().slice(0, 10) : null,
        motivo_baja: nuevoEstado === 'descarte' ? 'Descarte' : 'Baja operativa',
      });
      setOk('Estado actualizado (historial conservado)');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Animales</h1>
      <p style={s.sub}>Registro, búsqueda y listado de la granja activa</p>

      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.row}>
        <button type="button" style={s.btn} onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cerrar formulario' : '+ Registrar animal'}
        </button>
        <input
          style={s.input}
          placeholder="Buscar por código…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarCodigo()}
        />
        <button type="button" style={s.btnGhost} onClick={buscarCodigo}>
          Buscar
        </button>
        <select style={s.select} value={sexo} onChange={(e) => setSexo(e.target.value)}>
          <option value="">Sexo: todos</option>
          <option value="H">Hembra</option>
          <option value="M">Macho</option>
        </select>
        <select style={s.select} value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="activo">Activos</option>
          <option value="baja_muerte">Baja muerte</option>
          <option value="baja_venta">Baja venta</option>
          <option value="descarte">Descarte</option>
        </select>
        <button type="button" style={s.btnGhost} onClick={load}>
          Filtrar
        </button>
        <span style={{ color: '#52796f' }}>{total} resultado(s)</span>
      </div>

      {showForm && (
        <form onSubmit={registrar} style={s.card}>
          <h3 style={{ marginTop: 0 }}>Nuevo animal</h3>
          <div style={s.row}>
            <input
              style={s.input}
              required
              placeholder="Código *"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
            <select
              style={s.select}
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
            >
              <option value="H">Hembra</option>
              <option value="M">Macho</option>
            </select>
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
                  {j.area ? `${j.area} / ` : ''}
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
              style={{ ...s.input, minWidth: 220 }}
              placeholder="Particularidad (opcional)"
              value={form.particularidad}
              onChange={(e) => setForm({ ...form, particularidad: e.target.value })}
            />
            <button type="submit" style={s.btn}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {detalle?.historial && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Historial de {detalle.codigo}</h3>
          <ul>
            {(detalle.historial || []).map((h, i) => (
              <li key={i}>
                [{h.tipo}] {h.fecha}: {h.detalle}
              </li>
            ))}
          </ul>
        </div>
      )}

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Código</th>
            <th style={s.th}>Sexo</th>
            <th style={s.th}>Raza</th>
            <th style={s.th}>Categoría</th>
            <th style={s.th}>Área / Jaula</th>
            <th style={s.th}>Estado</th>
            <th style={s.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#666' }}>
                Sin animales para los filtros actuales
              </td>
            </tr>
          ) : (
            items.map((a) => (
              <tr key={a.id}>
                <td style={s.td}>{a.codigo}</td>
                <td style={s.td}>{a.sexo}</td>
                <td style={s.td}>{a.raza || '—'}</td>
                <td style={s.td}>{a.categoria || '—'}</td>
                <td style={s.td}>
                  {a.area || '—'} / {a.jaula || '—'}
                </td>
                <td style={s.td}>{a.estado}</td>
                <td style={s.td}>
                  {a.estado === 'activo' && (
                    <>
                      <button
                        type="button"
                        style={{ ...s.btnDanger, marginRight: 6 }}
                        onClick={() => actualizarEstado(a.id, 'descarte')}
                      >
                        Descarte
                      </button>
                      <button
                        type="button"
                        style={s.btnGhost}
                        onClick={async () => {
                          try {
                            const { data } = await api.get(
                              `/animales/buscar/${encodeURIComponent(a.codigo)}`
                            );
                            setDetalle(data);
                          } catch (err) {
                            setError(err.response?.data?.error || 'No se pudo cargar ficha');
                          }
                        }}
                      >
                        Ficha
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Animales;
