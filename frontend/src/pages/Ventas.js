import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-27 ventas */
const Ventas = () => {
  const [lista, setLista] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [razas, setRazas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_animal: '',
    fecha: new Date().toISOString().slice(0, 10),
    clasificacion: '',
    categoria: '',
    cantidad: 1,
    comprador: '',
    precio: '',
  });

  const load = useCallback(async () => {
    try {
      const [v, a, c, r] = await Promise.all([
        api.get('/ventas'),
        api.get('/animales', { params: { estado: 'activo' } }),
        api.get('/catalogos/categorias'),
        api.get('/catalogos/razas'),
      ]);
      setLista(v.data);
      setAnimales(a.data.data || a.data);
      setCategorias(c.data);
      setRazas(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      await api.post('/ventas', {
        fecha: form.fecha,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        clasificacion: form.clasificacion || null,
        categoria: form.categoria || null,
        cantidad,
        comprador: form.comprador || null,
        precio: form.precio ? Number(form.precio) : null,
      });
      setOk('Venta registrada');
      setForm((f) => ({
        ...f,
        id_animal: '',
        cantidad: 1,
        comprador: '',
        precio: '',
      }));
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || data?.message || 'No se pudo registrar (revise tope de población)');
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
        <button type="submit" style={s.btn}>
          Registrar venta
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Cantidad</th>
            <th style={s.th}>Categoría</th>
            <th style={s.th}>Clasificación</th>
            <th style={s.th}>Comprador</th>
            <th style={s.th}>Precio</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ventas;
