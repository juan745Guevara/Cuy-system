'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { clearDraft, loadDraft, saveDraft } from '../utils/draftForm';

const DRAFT_KEY = 'draft:animales';

const emptyForm = () => ({
  codigo: '',
  sexo: 'H',
  id_raza: '',
  id_categoria: '',
  id_jaula: '',
  fecha_nacimiento: '',
  particularidad: '',
  confirmar_reuso: false,
});

async function blobErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json.error || json.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.error || data?.message || fallback;
}

/**
 * UI Entrega 1 — ficha de animal
 * Registrar, actualizar, buscar y list/filtrar animales
 */
const Animales = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [sexo, setSexo] = useState('');
  const [estado, setEstado] = useState('activo');
  const [idCategoria, setIdCategoria] = useState('');
  const [idRaza, setIdRaza] = useState('');
  const [idArea, setIdArea] = useState('');
  const [idJaula, setIdJaula] = useState('');
  const [sort, setSort] = useState('codigo');
  const [areas, setAreas] = useState([]);
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notFoundCodigo, setNotFoundCodigo] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [partTexto, setPartTexto] = useState('');
  const [bajaModal, setBajaModal] = useState(null);
  const [bajaFecha, setBajaFecha] = useState(new Date().toISOString().slice(0, 10));
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const buildParams = useCallback(() => {
    const params = {};
    if (estado) params.estado = estado;
    if (q.trim()) params.q = q.trim();
    if (sexo) params.sexo = sexo;
    if (idCategoria) params.id_categoria = idCategoria;
    if (idRaza) params.id_raza = idRaza;
    if (idArea) params.id_area = idArea;
    if (idJaula) params.id_jaula = idJaula;
    if (sort) params.sort = sort;
    return params;
  }, [estado, q, sexo, idCategoria, idRaza, idArea, idJaula, sort]);

  const load = useCallback(async () => {
    setError('');
    setNotFoundCodigo('');
    try {
      const params = buildParams();
      const { data } = await api.get('/cuyes/animals', { params });
      const rows = Array.isArray(data.data || data) ? [...(data.data || data)] : [];
      if (params.sort === 'fecha_nacimiento') {
        rows.sort((a, b) =>
          String(a.fecha_nacimiento || '').localeCompare(String(b.fecha_nacimiento || ''))
        );
      } else if (params.sort === 'ubicacion') {
        rows.sort((a, b) =>
          `${a.area || ''}/${a.jaula || ''}`.localeCompare(`${b.area || ''}/${b.jaula || ''}`)
        );
      } else {
        rows.sort((a, b) => String(a.codigo || '').localeCompare(String(b.codigo || '')));
      }
      setItems(rows);
      setTotal(data.total ?? rows.length);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar animales');
    }
  }, [buildParams]);

  const loadCatalogs = useCallback(async () => {
    try {
      const [r, c, j, a] = await Promise.all([
        api.get('/cuyes/catalogs/breeds'),
        api.get('/cuyes/catalogs/categories'),
        api.get('/recintos'),
        api.get('/areas'),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
      setJaulas(j.data);
      setAreas(a.data);
    } catch {
      /* catálogos opcionales al inicio */
    }
  }, []);

  useEffect(() => {
    load();
    loadCatalogs();
  }, [load, loadCatalogs]);

  useEffect(() => {
    saveDraft(DRAFT_KEY, form);
  }, [form]);

  const buscarCodigo = async () => {
    if (!q.trim()) return load();
    setError('');
    setDetalle(null);
    setNotFoundCodigo('');
    try {
      const { data } = await api.get(`/cuyes/animals/search/${encodeURIComponent(q.trim())}`);
      setItems([data]);
      setTotal(1);
      setDetalle(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFoundCodigo(err.response?.data?.codigo || q.trim());
        setError(err.response?.data?.error || 'No encontrado');
      } else {
        setError(err.response?.data?.error || 'No encontrado');
      }
      setItems([]);
      setTotal(0);
    }
  };

  const prefillRegistrar = (codigo) => {
    setForm((f) => ({ ...f, codigo: codigo || '' }));
    setShowForm(true);
    setNotFoundCodigo('');
    setError('');
  };

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const body = {
        codigo: form.codigo,
        sexo: form.sexo,
        id_raza: form.id_raza || null,
        id_categoria: form.id_categoria || null,
        id_jaula: form.id_jaula || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        particularidad: form.particularidad || null,
      };
      if (form.confirmar_reuso) body.confirmar_reuso = true;
      await api.post('/cuyes/animals', body);
      setOk(`Animal ${form.codigo} registrado`);
      setShowForm(false);
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.animal) {
        setError(
          `${data.error || 'Código en conflicto'}. Animal existente: ${data.animal.codigo || ''} (${data.animal.estado || ''})`
        );
      } else {
        setError(data?.error || 'No se pudo registrar');
      }
    }
  };

  const confirmarBaja = async () => {
    if (!bajaModal) return;
    setError('');
    try {
      await api.patch(`/cuyes/animals/${bajaModal.id}`, {
        estado: bajaModal.estado,
        fecha_baja: bajaFecha,
        motivo_baja: bajaMotivo || (bajaModal.estado === 'descarte' ? 'Descarte' : 'Baja operativa'),
      });
      setOk('Estado actualizado (historial conservado)');
      setBajaModal(null);
      setBajaMotivo('');
      load();
      if (detalle?.id === bajaModal.id) setDetalle(null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const agregarParticularidad = async () => {
    if (!detalle?.id || !partTexto.trim()) return;
    setError('');
    try {
      await api.patch(`/cuyes/animals/${detalle.id}`, { particularidad: partTexto.trim() });
      setOk('Particularidad registrada');
      setPartTexto('');
      const { data } = await api.get(`/cuyes/animals/search/${encodeURIComponent(detalle.codigo)}`);
      setDetalle(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar particularidad');
    }
  };

  const exportar = async () => {
    setError('');
    const params = buildParams();
    try {
      const res = await api.get('/cuyes/reports/animals', { responseType: 'blob', params });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'animales-filtrados.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const { data } = await api.get('/cuyes/animals', { params });
          const rows = data.data || data;
          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'animales-filtrados.json';
          a.click();
          window.URL.revokeObjectURL(url);
          setOk('Exportación vía listado (reporte Excel no disponible)');
        } catch (e2) {
          setError(e2.response?.data?.error || 'No se pudo exportar');
        }
      } else {
        setError(await blobErrorMessage(err, 'No se pudo exportar'));
      }
    }
  };

  const jaulasFiltradas = idArea
    ? jaulas.filter((j) => String(j.id_area) === String(idArea))
    : jaulas;

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Animales</h1>
      <p style={s.sub}>Registro, búsqueda y listado de la granja activa</p>

      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {notFoundCodigo && (
        <div style={s.row}>
          <button type="button" style={s.btn} onClick={() => prefillRegistrar(notFoundCodigo)}>
            Registrar este código ({notFoundCodigo})
          </button>
        </div>
      )}

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
          <option value="">Todos</option>
        </select>
        <select style={s.select} value={idRaza} onChange={(e) => setIdRaza(e.target.value)}>
          <option value="">Raza</option>
          {razas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={idCategoria}
          onChange={(e) => setIdCategoria(e.target.value)}
        >
          <option value="">Categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select style={s.select} value={idArea} onChange={(e) => setIdArea(e.target.value)}>
          <option value="">Área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select style={s.select} value={idJaula} onChange={(e) => setIdJaula(e.target.value)}>
          <option value="">Jaula</option>
          {jaulasFiltradas.map((j) => (
            <option key={j.id} value={j.id}>
              {j.area ? `${j.area} / ` : ''}
              {j.codigo}
            </option>
          ))}
        </select>
        <select style={s.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="codigo">Orden: código</option>
          <option value="fecha_nacimiento">Orden: nacimiento</option>
          <option value="ubicacion">Orden: ubicación</option>
        </select>
        <button type="button" style={s.btnGhost} onClick={load}>
          Filtrar
        </button>
        <button type="button" style={s.btnGhost} onClick={exportar}>
          Exportar filtrados
        </button>
        <span style={{ color: '#6B5348' }}>{total} resultado(s)</span>
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
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#4F0C10' }}>
              <input
                type="checkbox"
                checked={!!form.confirmar_reuso}
                onChange={(e) => setForm({ ...form, confirmar_reuso: e.target.checked })}
              />
              Confirmar reuso de código en baja
            </label>
            <button type="submit" style={s.btn}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {detalle && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Ficha de {detalle.codigo}</h3>
          <p style={s.sub}>
            {detalle.sexo} · {detalle.raza || '—'} · {detalle.categoria || '—'} ·{' '}
            {detalle.area || '—'} / {detalle.jaula || '—'} · {detalle.estado}
          </p>
          {detalle.historial && (
            <ul>
              {(detalle.historial || []).map((h, i) => (
                <li key={i}>
                  [{h.tipo}] {h.fecha}: {h.detalle}
                </li>
              ))}
            </ul>
          )}
          {(detalle.tratamientos || []).length > 0 && (
            <div>
              <h4>Tratamientos</h4>
              <ul>
                {detalle.tratamientos.map((t) => (
                  <li key={t.id}>
                    {t.tipo} · {t.producto} · {t.estado} · {String(t.fecha_inicio).slice(0, 10)} →{' '}
                    {String(t.fecha_termino).slice(0, 10)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detalle.estado === 'activo' && (
            <div style={s.row}>
              <input
                style={{ ...s.input, minWidth: 260 }}
                placeholder="Nueva particularidad"
                value={partTexto}
                onChange={(e) => setPartTexto(e.target.value)}
              />
              <button type="button" style={s.btnGhost} onClick={agregarParticularidad}>
                Agregar particularidad
              </button>
            </div>
          )}
        </div>
      )}

      {bajaModal && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Confirmar {bajaModal.estado} — {bajaModal.codigo}
          </h3>
          <div style={s.row}>
            <input
              style={s.input}
              type="date"
              required
              value={bajaFecha}
              onChange={(e) => setBajaFecha(e.target.value)}
            />
            <input
              style={{ ...s.input, minWidth: 240 }}
              placeholder="Motivo de baja"
              value={bajaMotivo}
              onChange={(e) => setBajaMotivo(e.target.value)}
            />
            <button type="button" style={s.btnDanger} onClick={confirmarBaja}>
              Confirmar
            </button>
            <button type="button" style={s.btnGhost} onClick={() => setBajaModal(null)}>
              Cancelar
            </button>
          </div>
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
                        onClick={() => {
                          setBajaModal({ id: a.id, codigo: a.codigo, estado: 'descarte' });
                          setBajaFecha(new Date().toISOString().slice(0, 10));
                          setBajaMotivo('Descarte');
                        }}
                      >
                        Descarte
                      </button>
                      <button
                        type="button"
                        style={{ ...s.btnGhost, marginRight: 6 }}
                        onClick={() => {
                          setBajaModal({ id: a.id, codigo: a.codigo, estado: 'baja_muerte' });
                          setBajaFecha(new Date().toISOString().slice(0, 10));
                          setBajaMotivo('');
                        }}
                      >
                        Baja
                      </button>
                      <button
                        type="button"
                        style={s.btnGhost}
                        onClick={async () => {
                          try {
                            const { data } = await api.get(`/cuyes/animals/search/${encodeURIComponent(a.codigo)}`
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
