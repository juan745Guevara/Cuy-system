import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-08 partos */
const Partos = () => {
  const [lista, setLista] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    id_hembra: '',
    id_empadre: '',
    fecha_parto: new Date().toISOString().slice(0, 10),
    vivos_m: 0,
    vivos_h: 0,
    muertos: 0,
  });

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        api.get('/partos'),
        api.get('/animales', { params: { sexo: 'H', estado: 'activo' } }),
      ]);
      setLista(p.data);
      setHembras(h.data.data || h.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar partos');
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
      await api.post('/partos', {
        ...form,
        id_hembra: Number(form.id_hembra),
        id_empadre: form.id_empadre ? Number(form.id_empadre) : null,
        vivos_m: Number(form.vivos_m),
        vivos_h: Number(form.vivos_h),
        muertos: Number(form.muertos),
      });
      setOk('Parto registrado');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el parto');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Partos</h1>
      <p style={s.sub}>Registro de camada al nacimiento</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <select
          style={s.select}
          required
          value={form.id_hembra}
          onChange={(e) => setForm({ ...form, id_hembra: e.target.value })}
        >
          <option value="">Hembra</option>
          {hembras.map((a) => (
            <option key={a.id} value={a.id}>
              {a.codigo}
            </option>
          ))}
        </select>
        <input
          style={s.input}
          type="date"
          required
          value={form.fecha_parto}
          onChange={(e) => setForm({ ...form, fecha_parto: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Vivos M"
          value={form.vivos_m}
          onChange={(e) => setForm({ ...form, vivos_m: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Vivos H"
          value={form.vivos_h}
          onChange={(e) => setForm({ ...form, vivos_h: e.target.value })}
        />
        <input
          style={s.input}
          type="number"
          min="0"
          placeholder="Muertos"
          value={form.muertos}
          onChange={(e) => setForm({ ...form, muertos: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="ID empadre (opc.)"
          value={form.id_empadre}
          onChange={(e) => setForm({ ...form, id_empadre: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar parto
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Hembra</th>
            <th style={s.th}>Vivos M</th>
            <th style={s.th}>Vivos H</th>
            <th style={s.th}>Muertos</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id}>
              <td style={s.td}>{String(p.fecha_parto).slice(0, 10)}</td>
              <td style={s.td}>{p.hembra_codigo}</td>
              <td style={s.td}>{p.vivos_m}</td>
              <td style={s.td}>{p.vivos_h}</td>
              <td style={s.td}>{p.muertos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Partos;
