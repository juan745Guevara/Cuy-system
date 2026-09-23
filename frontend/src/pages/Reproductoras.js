import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { promedioPesos } from '../utils/draftForm';

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

/** Alta de hembras, resultado de ciclo y ficha individual */
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
        api.get('/catalogs/breeds'),
        api.get('/catalogs/categories'),
        api.get('/cages'),
        api.get('/animals', { params: { sexo: 'H', estado: 'activo' } }),
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
      await api.post('/breedings/breeding-females', {
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
      const { data } = await api.get(`/breedings/breeding-females/${id}`);
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
      await api.patch(`/breedings/${idEmpadre}/females/${idHembra}`, { resultado });
      setOk(`Resultado: ${resultado}`);
      verFicha(idHembra);
      if (resultado === 'murio') loadBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar resultado');
    }
  };

  const exportarHembra = async (animal) => {
    setError('');
    try {
      const params = animal?.id
        ? { id_animal: animal.id }
        : animal?.codigo
          ? { codigo: animal.codigo }
          : {};
      const res = await api.get('/reports/females', { responseType: 'blob', params });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hembra-${animal?.codigo || animal?.id || 'export'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(await blobErrorMessage(err, 'No se pudo exportar'));
    }
  };

  const fmtPesosParto = (p) => {
    const m = [p.peso_m1, p.peso_m2, p.peso_m3].filter((x) => x != null);
    const h = [p.peso_h1, p.peso_h2, p.peso_h3].filter((x) => x != null);
    const prom = promedioPesos(p.peso_m1, p.peso_m2, p.peso_m3, p.peso_h1, p.peso_h2, p.peso_h3);
    const parts = [];
    if (m.length) parts.push(`M: ${m.join(', ')} g`);
    if (h.length) parts.push(`H: ${h.join(', ')} g`);
    if (prom != null) parts.push(`prom ${prom} g`);
    return parts.length ? ` · ${parts.join(' · ')}` : '';
  };

  const jaulaLabel = (a) => a?.jaula || a?.jaula_codigo || a?.id_jaula || '—';

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
                <td style={s.td}>{jaulaLabel(a)}</td>
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
          <div style={{ ...s.row, justifyContent: 'space-between' }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Ficha {ficha.animal?.codigo}</h3>
            <button type="button" style={s.btnGhost} onClick={() => exportarHembra(ficha.animal)}>
              Exportar Excel
            </button>
          </div>
          <p style={s.sub}>
            Nacimiento: {ficha.animal?.fecha_nacimiento || '—'} · Estado: {ficha.animal?.estado} ·
            Jaula: {jaulaLabel(ficha.animal)}
          </p>

          {ficha.indicadores && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Indicadores</strong>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                {Object.entries(ficha.indicadores).map(([k, v]) => (
                  <li key={k}>
                    {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(ficha.ciclos || []).length === 0 && <p>Sin ciclos de empadre.</p>}
          {(ficha.ciclos || []).map((c) => (
            <div
              key={`${c.id}-${c.resultado}`}
              style={{ borderTop: '1px solid #D4C6B0', paddingTop: '0.75rem', marginTop: '0.75rem' }}
            >
              <p>
                Empadre #{c.id} — {String(c.fecha_empadre).slice(0, 10)} — resultado:{' '}
                <strong>{c.resultado || 'abierto'}</strong>
              </p>
              {(c.partos || []).map((p) => (
                <p key={p.id} style={{ margin: '0.25rem 0' }}>
                  Parto #{p.id}: {String(p.fecha_parto).slice(0, 10)} · vivos M/H {p.vivos_m}/
                  {p.vivos_h} · muertos {p.muertos}
                  {fmtPesosParto(p)}
                </p>
              ))}
              {(!c.resultado || c.resultado === 'abierto') && (
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
