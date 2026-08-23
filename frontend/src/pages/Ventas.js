import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** NUC-27 ventas */
const Ventas = () => {
  const [lista, setLista] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_animal: '',
    fecha: new Date().toISOString().slice(0, 10),
    clasificacion: 'venta',
    categoria: '',
    cantidad: 1,
    comprador: '',
    precio: '',
  });

  const load = useCallback(async () => {
    try {
      const [v, a] = await Promise.all([
        api.get('/ventas'),
        api.get('/animales', { params: { estado: 'activo' } }),
      ]);
      setLista(v.data);
      setAnimales(a.data.data || a.data);
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
    try {
      await api.post('/ventas', {
        ...form,
        id_animal: form.id_animal ? Number(form.id_animal) : null,
        cantidad: Number(form.cantidad),
        precio: form.precio ? Number(form.precio) : null,
      });
      setOk('Venta registrada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
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
            <th style={s.th}>Comprador</th>
            <th style={s.th}>Precio</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((v) => (
            <tr key={v.id}>
              <td style={s.td}>{String(v.fecha).slice(0, 10)}</td>
              <td style={s.td}>{v.cantidad}</td>
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
