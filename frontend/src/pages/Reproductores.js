import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-12 registrar macho reproductor */
const Reproductores = () => {
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({
    codigo: '',
    id_raza: '',
    id_categoria: '',
    id_jaula: '',
    fecha_nacimiento: '',
    particularidad: '',
  });

  const load = useCallback(async () => {
    try {
      const [r, c, j, a] = await Promise.all([
        api.get('/catalogos/razas'),
        api.get('/catalogos/categorias'),
        api.get('/jaulas'),
        api.get('/animales', { params: { sexo: 'M', estado: 'activo' } }),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
      setJaulas(j.data);
      setLista(a.data.data || a.data);
      const catRep = (c.data || []).find((x) =>
        String(x.nombre).toLowerCase() === 'reproductor'
      );
      if (catRep) {
        setForm((f) => ({ ...f, id_categoria: f.id_categoria || String(catRep.id) }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  const verResultados = async (id) => {
    setError('');
    try {
      const { data } = await api.get(`/empadres/reproductores/${id}`);
      setDetalle(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar ficha del macho');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/empadres/reproductores', {
        codigo: form.codigo,
        id_raza: form.id_raza ? Number(form.id_raza) : null,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        particularidad: form.particularidad || null,
      });
      setOk(`Reproductor ${form.codigo} registrado`);
      setForm((f) => ({
        ...f,
        codigo: '',
        id_jaula: '',
        fecha_nacimiento: '',
        particularidad: '',
      }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Reproductores</h1>
      <p style={s.sub}>Alta de machos para el ciclo de empadre</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <input
          style={s.input}
          required
          placeholder="Código (ej. UM01)"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />
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
          style={{ ...s.input, minWidth: 180 }}
          placeholder="Particularidad"
          value={form.particularidad}
          onChange={(e) => setForm({ ...form, particularidad: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Registrar macho
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Código</th>
            <th style={s.th}>Nacimiento</th>
            <th style={s.th}>Jaula</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((a) => (
            <tr key={a.id}>
              <td style={s.td}>{a.codigo}</td>
              <td style={s.td}>{a.fecha_nacimiento || '—'}</td>
              <td style={s.td}>{a.jaula_codigo || a.id_jaula || '—'}</td>
              <td style={s.td}>
                <button type="button" style={s.btnGhost} onClick={() => verResultados(a.id)}>
                  Resultados (CUY-14)
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detalle && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Ficha reproductiva · {detalle.animal?.codigo}
          </h3>
          <p style={s.sub}>
            Empadres: {detalle.indicadores?.empadres ?? 0} · Preñez:{' '}
            {detalle.indicadores?.porcentaje_prenez != null
              ? `${detalle.indicadores.porcentaje_prenez}%`
              : '—'}{' '}
            · Promedio camada: {detalle.indicadores?.promedio_camada ?? '—'}
          </p>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Jaula</th>
                <th style={s.th}>Hembras</th>
                <th style={s.th}>Preñadas</th>
                <th style={s.th}>Partos (camada M/H)</th>
              </tr>
            </thead>
            <tbody>
              {(detalle.empadres || []).map((e) => (
                <tr key={e.id}>
                  <td style={s.td}>{String(e.fecha_empadre).slice(0, 10)}</td>
                  <td style={s.td}>{e.jaula || '—'}</td>
                  <td style={s.td}>{e.total_hembras}</td>
                  <td style={s.td}>{e.prenadas}</td>
                  <td style={s.td}>
                    {(Array.isArray(e.partos) ? e.partos : [])
                      .map(
                        (p) =>
                          `${p.hembra_codigo}: ${p.tamano_camada} (${p.vivos_m}M/${p.vivos_h}H)`
                      )
                      .join(' · ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reproductores;
