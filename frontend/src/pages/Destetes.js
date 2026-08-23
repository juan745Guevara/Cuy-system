import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-09 destetes */
const Destetes = () => {
  const [lista, setLista] = useState([]);
  const [partos, setPartos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_parto: '',
    fecha_destete: new Date().toISOString().slice(0, 10),
    destetados_m: 0,
    destetados_h: 0,
    muertos: 0,
  });

  const load = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([api.get('/destetes'), api.get('/partos')]);
      setLista(d.data);
      setPartos(p.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar destetes');
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
      await api.post('/destetes', {
        id_parto: Number(form.id_parto),
        fecha_destete: form.fecha_destete,
        destetados_m: Number(form.destetados_m),
        destetados_h: Number(form.destetados_h),
        muertos: Number(form.muertos),
      });
      setOk('Destete registrado');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Destetes</h1>
      <p style={s.sub}>Cierre de camada y paso a recría</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <select
          style={s.select}
          required
          value={form.id_parto}
          onChange={(e) => setForm({ ...form, id_parto: e.target.value })}
        >
          <option value="">Parto</option>
          {partos.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} {p.hembra_codigo} ({String(p.fecha_parto).slice(0, 10)})
            </option>
          ))}
        </select>
        <input
          style={s.input}
          type="date"
          required
          value={form.fecha_destete}
          onChange={(e) => setForm({ ...form, fecha_destete: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Destetados M"
          value={form.destetados_m}
          onChange={(e) => setForm({ ...form, destetados_m: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Destetados H"
          value={form.destetados_h}
          onChange={(e) => setForm({ ...form, destetados_h: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Muertos"
          value={form.muertos}
          onChange={(e) => setForm({ ...form, muertos: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar destete
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Hembra</th>
            <th style={s.th}>Parto</th>
            <th style={s.th}>Dest. M</th>
            <th style={s.th}>Dest. H</th>
            <th style={s.th}>Muertos</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((d) => (
            <tr key={d.id}>
              <td style={s.td}>{String(d.fecha_destete).slice(0, 10)}</td>
              <td style={s.td}>{d.hembra_codigo}</td>
              <td style={s.td}>{String(d.fecha_parto).slice(0, 10)}</td>
              <td style={s.td}>{d.destetados_m}</td>
              <td style={s.td}>{d.destetados_h}</td>
              <td style={s.td}>{d.muertos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Destetes;
