'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:ventas';

const TIPOS_COMPROBANTE = [
  ['boleta', 'Boleta'],
  ['factura', 'Factura'],
  ['recibo', 'Recibo'],
  ['nota_venta', 'Nota de venta'],
];

/** Mensaje en español para los errores de venta que devuelve la API. */
function mensajeVenta(err, porDefecto) {
  const data = err.response?.data;
  if (err.response?.status === 409 && data?.venta_previa) {
    return `Ese comprobante ya se usó en la venta #${data.venta_previa.id}${
      data.venta_previa.granja ? ` (${data.venta_previa.granja})` : ''
    }. Verifique la serie y el número.`;
  }
  if (err.response?.status === 409 && data?.campo === 'id_animal') {
    return 'El animal ya no está activo (fue vendido, murió o se descartó). Elija otro.';
  }
  if (['tipo_comprobante', 'serie', 'numero'].includes(data?.campo)) {
    return 'Ingrese el tipo, la serie y el número del comprobante emitido por la caja UNAS.';
  }
  return data?.error || data?.message || porDefecto;
}
const emptyForm = () => ({
  id_animal: '',
  fecha: new Date().toISOString().slice(0, 10),
  clasificacion: '',
  categoria: '',
  cantidad: 1,
  comprador: '',
  precio: '',
  tipo_comprobante: '',
  serie: '',
  numero: '',
});

/** Ventas y descartes */
const Ventas = () => {
  const [lista, setLista] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [razas, setRazas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [descartes, setDescartes] = useState([]);
  const [sel, setSel] = useState({});
  const [dForm, setDForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    comprador: '',
    precio: '',
    tipo_comprobante: '',
    serie: '',
    numero: '',
  });
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [v, a, c, r] = await Promise.all([
        api.get('/cuyes/sales'),
        api.get('/animals', { params: { estado: 'activo' } }),
        api.get('/cuyes/catalogs/categories'),
        api.get('/cuyes/catalogs/breeds'),
      ]);
      setLista(v.data);
      setAnimales(a.data.data || a.data);
      setCategorias(c.data);
      setRazas(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  const loadDescartes = useCallback(async () => {
    try {
      const d = await api.get('/cuyes/sales/discards');
      setDescartes(d.data);
      setSel(Object.fromEntries(d.data.map((g) => [g.categoria, true])));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar descartes');
    }
  }, []);

  useEffect(() => {
    load();
    loadDescartes();
  }, [load, loadDescartes]);

  useEffect(() => {
    saveDraft(DRAFT_KEY, form);
  }, [form]);

  const toggleSel = (categoria) =>
    setSel((prev) => ({ ...prev, [categoria]: !prev[categoria] }));

  const sellDiscards = async () => {
    setError('');
    setOk('');
    const ids = descartes.filter((g) => sel[g.categoria]).flatMap((g) => g.id_animales);
    if (!ids.length) {
      setError('Seleccioná al menos un grupo de descartes');
      return;
    }
    if (!dForm.tipo_comprobante || !dForm.serie.trim() || !dForm.numero.trim()) {
      setError('Ingrese el tipo, la serie y el número del comprobante emitido por la caja UNAS.');
      return;
    }
    try {
      const r = await api.post('/cuyes/sales/discards', {
        fecha: dForm.fecha,
        comprador: dForm.comprador || null,
        precio: dForm.precio ? Number(dForm.precio) : null,
        id_animales: ids,
        tipo_comprobante: dForm.tipo_comprobante,
        serie: dForm.serie,
        numero: dForm.numero,
      });
      setOk(`Venta agrupada registrada (${r.data.registradas} descartes)`);
      setDForm((f) => ({ ...f, tipo_comprobante: '', serie: '', numero: '' }));
      loadDescartes();
      load();
    } catch (err) {
      setError(mensajeVenta(err, 'No se pudieron vender los descartes'));
    }
  };

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
      await api.post('/cuyes/sales', {
        fecha: form.fecha,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        clasificacion: form.clasificacion || null,
        categoria: form.categoria || null,
        cantidad,
        comprador: form.comprador || null,
        precio: form.precio ? Number(form.precio) : null,
        tipo_comprobante: form.tipo_comprobante,
        serie: form.serie,
        numero: form.numero,
      });
      setOk('Venta registrada');
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(mensajeVenta(err, 'No se pudo registrar (revise tope de población)'));
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Ventas</h1>
      <p style={s.sub}>Salidas comerciales de la granja</p>
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
          <option value="">Animal (opc.)</option>
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
        <input
          style={s.input}
          placeholder="Comprador"
          value={form.comprador}
          onChange={(e) => setForm({ ...form, comprador: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
        />
        <select
          style={s.select}
          required
          value={form.tipo_comprobante}
          onChange={(e) => setForm({ ...form, tipo_comprobante: e.target.value })}
        >
          <option value="">Comprobante *</option>
          {TIPOS_COMPROBANTE.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        <input
          style={s.input}
          placeholder="Serie *"
          required
          value={form.serie}
          onChange={(e) => setForm({ ...form, serie: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="Número *"
          required
          value={form.numero}
          onChange={(e) => setForm({ ...form, numero: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar venta
        </button>
      </form>

      <div style={{ ...s.card, marginTop: '1.2rem' }}>
        <h2 style={{ ...s.title, fontSize: '1.25rem' }}>Descartes para venta</h2>
        {descartes.length === 0 ? (
          <p style={{ margin: 0, color: '#7A6358' }}>No hay descartes pendientes.</p>
        ) : (
          <>
            <div style={s.row}>
              <input
                style={s.input}
                type="date"
                value={dForm.fecha}
                onChange={(e) => setDForm({ ...dForm, fecha: e.target.value })}
              />
              <input
                style={s.input}
                placeholder="Comprador"
                value={dForm.comprador}
                onChange={(e) => setDForm({ ...dForm, comprador: e.target.value })}
              />
              <input
                style={s.input}
                type="number"
                step="0.01"
                placeholder="Precio"
                value={dForm.precio}
                onChange={(e) => setDForm({ ...dForm, precio: e.target.value })}
              />
              <select
                style={s.select}
                value={dForm.tipo_comprobante}
                onChange={(e) => setDForm({ ...dForm, tipo_comprobante: e.target.value })}
              >
                <option value="">Comprobante *</option>
                {TIPOS_COMPROBANTE.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                style={s.input}
                placeholder="Serie *"
                value={dForm.serie}
                onChange={(e) => setDForm({ ...dForm, serie: e.target.value })}
              />
              <input
                style={s.input}
                placeholder="Número *"
                value={dForm.numero}
                onChange={(e) => setDForm({ ...dForm, numero: e.target.value })}
              />
              <button type="button" style={s.btn} onClick={sellDiscards}>
                Vender seleccionados
              </button>
            </div>
            <div style={s.row}>
              {descartes.map((g) => (
                <label
                  key={g.categoria}
                  style={{
                    ...s.btnGhost,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!sel[g.categoria]}
                    onChange={() => toggleSel(g.categoria)}
                  />
                  {g.categoria || 'Sin categoría'} ({g.cantidad})
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={s.tableScroll}><table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Cantidad</th>
            <th style={s.th}>Categoría</th>
            <th style={s.th}>Clasificación</th>
            <th style={s.th}>Comprador</th>
            <th style={s.th}>Precio</th>
            <th style={s.th}>Comprobante</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((v) => (
            <tr key={v.id}>
              <td style={s.td}>{String(v.fecha).slice(0, 10)}</td>
              <td style={s.td}>{v.cantidad}</td>
              <td style={s.td}>{v.categoria || '—'}</td>
              <td style={s.td}>{v.clasificacion || '—'}</td>
              <td style={s.td}>{v.comprador || '—'}</td>
              <td style={s.td}>{v.precio ?? '—'}</td>
              <td style={s.td}>
                {v.tipo_comprobante
                  ? `${v.tipo_comprobante} ${v.serie || ''}-${v.numero || ''}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
};

export default Ventas;
