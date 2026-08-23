import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-06 alta · CUY-10 resultado de ciclo · CUY-11 ficha */
const Reproductoras = () => {
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [lista, setLista] = useState([]);
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    codigo: '',
    id_raza: '',
    id_categoria: '',
    id_jaula: '',
    fecha_nacimiento: '',
    particularidad: '',
  });

  const loadBase = useCallback(async () => {
    try {
      const [r, c, j, a] = await Promise.all([
        api.get('/catalogos/razas'),
        api.get('/catalogos/categorias'),
        api.get('/jaulas'),
        api.get('/animales', { params: { sexo: 'H', estado: 'activo' } }),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
      setJaulas(j.data);
      const animals = a.data.data || a.data;
      setLista(animals);
      const catRep = (c.data || []).find((x) =>
        String(x.nombre).toLowerCase().includes('reproductora')
      );
      if (catRep) {
        setForm((f) => ({ ...f, id_categoria: f.id_categoria || String(catRep.id) }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/empadres/reproductoras', {
        codigo: form.codigo,
        id_raza: form.id_raza ? Number(form.id_raza) : null,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        particularidad: form.particularidad || null,
      });
      setOk(`Reproductora ${form.codigo} registrada`);
      setForm((f) => ({
        ...f,
        codigo: '',
        id_jaula: '',
        fecha_nacimiento: '',
        particularidad: '',
      }));
      loadBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  };

  const verFicha = async (id) => {
    setError('');
    try {
      const { data } = await api.get(`/empadres/reproductoras/${id}`);
      setFicha(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar ficha');
      setFicha(null);
    }
  };

  const setResultado = async (idEmpadre, idHembra, resultado) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/empadres/${idEmpadre}/hembras/${idHembra}`, { resultado });
      setOk(`Resultado: ${resultado}`);
      verFicha(idHembra);
      if (resultado === 'murio') loadBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar resultado');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Reproductoras</h1>
      <p style={s.sub}>Alta, ficha individual y cierre de ciclo (vacía / aborto / murió)</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={{ ...s.card, ...s.row }}>
        <input
          style={s.input}
          required
          placeholder="Código (ej. U01)"
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
          Registrar hembra
        </button>
      </form>

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>Hembras activas</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Código</th>
              <th style={s.th}>Jaula</th>
              <th style={s.th} />
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id}>
                <td style={s.td}>{a.codigo}</td>
                <td style={s.td}>{a.jaula_codigo || a.id_jaula || '—'}</td>
                <td style={s.td}>
                  <button type="button" style={s.btnGhost} onClick={() => verFicha(a.id)}>
                    Ver ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ficha && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>
            Ficha {ficha.animal?.codigo}
          </h3>
          <p style={s.sub}>
            Nacimiento: {ficha.animal?.fecha_nacimiento || '—'} · Estado: {ficha.animal?.estado}
          </p>
          {(ficha.ciclos || []).length === 0 && <p>Sin ciclos de empadre.</p>}
          {(ficha.ciclos || []).map((c) => (
            <div
              key={`${c.id}-${c.resultado}`}
              style={{ borderTop: '1px solid #b7e4c7', paddingTop: '0.75rem', marginTop: '0.75rem' }}
            >
              <p>
                Empadre #{c.id} — {String(c.fecha_empadre).slice(0, 10)} — resultado:{' '}
                <strong>{c.resultado || 'abierto'}</strong>
              </p>
              {(c.partos || []).map((p) => (
                <p key={p.id} style={{ margin: '0.25rem 0' }}>
                  Parto #{p.id}: {String(p.fecha_parto).slice(0, 10)} · vivos M/H {p.vivos_m}/{p.vivos_h} ·
                  muertos {p.muertos}
                </p>
              ))}
              {!c.resultado && (
                <div style={s.row}>
                  {['vacia', 'aborto', 'murio', 'prenez'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      style={r === 'murio' ? s.btnDanger : s.btnGhost}
                      onClick={() => setResultado(c.id, ficha.animal.id, r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reproductoras;
