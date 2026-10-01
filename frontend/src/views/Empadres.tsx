'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:empadres';

const emptyForm = () => ({
  id_macho: '',
  hembras: [],
  id_jaula: '',
  fecha_empadre: new Date().toISOString().slice(0, 10),
  cantidad_prenadas: '',
  peso_antes: '',
  peso_despues: '',
  notas: '',
});

/** Empadre (monta) y cierre de ciclo */
const Empadres = () => {
  const [lista, setLista] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [machos, setMachos] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [filtroJaula, setFiltroJaula] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(() => loadDraft(DRAFT_KEY) || emptyForm());

  const load = useCallback(async () => {
    try {
      const [h, m, j] = await Promise.all([
        api.get('/animals', { params: { sexo: 'H', estado: 'activo' } }),
        api.get('/animals', { params: { sexo: 'M', estado: 'activo' } }),
        api.get('/recintos'),
      ]);
      setHembras(h.data.data || h.data);
      setMachos(m.data.data || m.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    saveDraft(DRAFT_KEY, form);
  }, [form]);

  const hembrasVisibles = useMemo(() => {
    if (!filtroJaula) return hembras;
    return hembras.filter((a) => String(a.id_jaula) === String(filtroJaula));
  }, [hembras, filtroJaula]);

  const toggleHembra = (id) => {
    setForm((f) => ({
      ...f,
      hembras: f.hembras.includes(id) ? f.hembras.filter((x) => x !== id) : [...f.hembras, id],
    }));
  };

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const hoy = new Date().toISOString().slice(0, 10);
    if (form.fecha_empadre > hoy) {
      setError('La fecha de empadre no puede ser futura');
      return;
    }
    try {
      const { data } = await api.post('/cuyes/breedings', {
        id_macho: form.id_macho ? Number(form.id_macho) : null,
        hembras: form.hembras,
        id_jaula: form.id_jaula ? Number(form.id_jaula) : null,
        fecha_empadre: form.fecha_empadre,
        cantidad_prenadas: form.cantidad_prenadas !== '' ? Number(form.cantidad_prenadas) : null,
        peso_antes: form.peso_antes ? Number(form.peso_antes) : null,
        peso_despues: form.peso_despues ? Number(form.peso_despues) : null,
        notas: form.notas || null,
      });
      setOk(`Empadre #${data.id} registrado`);
      setLista((prev) => [data, ...prev]);
      clearDraft(DRAFT_KEY);
      setForm(emptyForm());
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar empadre');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Empadres</h1>
      <p style={s.sub}>Registro de servicio (hembra y/o macho)</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <input
            style={s.input}
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={form.fecha_empadre}
            onChange={(e) => setForm({ ...form, fecha_empadre: e.target.value })}
          />
          <select
            style={s.select}
            value={form.id_macho}
            onChange={(e) => setForm({ ...form, id_macho: e.target.value })}
          >
            <option value="">Macho (opcional)</option>
            {machos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo}
              </option>
            ))}
          </select>
          <select
            style={s.select}
            value={form.id_jaula}
            onChange={async (e) => {
              const id = e.target.value;
              setForm((f) => ({ ...f, id_jaula: id }));
              setFiltroJaula(id);
              if (!id) return;
              try {
                const { data } = await api.get(`/cuyes/breedings/cage/${id}/females`);
                setForm((f) => ({
                  ...f,
                  id_jaula: id,
                  hembras: data.map((h) => h.id),
                  cantidad_prenadas: String(data.length || ''),
                }));
              } catch {
                /* keep manual selection */
              }
            }}
          >
            <option value="">Jaula empadre (auto-selecciona hembras)</option>
            {jaulas.map((j) => (
              <option key={j.id} value={j.id}>
                {j.area ? `${j.area} · ` : ''}
                {j.codigo}
              </option>
            ))}
          </select>
          <input
            style={s.input}
            type="number"
            min="0"
            placeholder="Cantidad preñadas"
            value={form.cantidad_prenadas}
            onChange={(e) => setForm({ ...form, cantidad_prenadas: e.target.value })}
          />
        </div>
        <div style={s.row}>
          <select
            style={s.select}
            value={filtroJaula}
            onChange={(e) => setFiltroJaula(e.target.value)}
          >
            <option value="">Filtrar hembras por jaula</option>
            {jaulas.map((j) => (
              <option key={`f-${j.id}`} value={j.id}>
                {j.codigo}
              </option>
            ))}
          </select>
        </div>
        <p>Hembras:</p>
        <div style={s.row}>
          {hembrasVisibles.length === 0 && (
            <span style={{ color: '#7A6358' }}>Sin hembras para el filtro</span>
          )}
          {hembrasVisibles.map((a) => (
            <label key={a.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.hembras.includes(a.id)}
                onChange={() => toggleHembra(a.id)}
              />
              {a.codigo}
              {a.jaula ? ` (${a.jaula})` : ''}
            </label>
          ))}
        </div>
        <div style={s.row}>
          <input
            style={s.input}
            type="number"
            step="0.01"
            placeholder="Peso antes"
            value={form.peso_antes}
            onChange={(e) => setForm({ ...form, peso_antes: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            step="0.01"
            placeholder="Peso después"
            value={form.peso_despues}
            onChange={(e) => setForm({ ...form, peso_despues: e.target.value })}
          />
          <input
            style={{ ...s.input, minWidth: 200 }}
            placeholder="Notas"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
          />
          <button type="submit" style={s.btn} disabled={form.hembras.length === 0}>
            Registrar empadre
          </button>
        </div>
      </form>

      {lista.length > 0 && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Últimos registrados en esta sesión</h3>
          <ul>
            {lista.map((e) => (
              <li key={e.id} style={{ marginBottom: 8 }}>
                #{e.id} — {e.fecha_empadre} — hembras: {(e.hembras || []).join(', ')}
                {e.cantidad_prenadas != null ? ` — preñadas: ${e.cantidad_prenadas}` : ''}{' '}
                {e.id_macho && (
                  <button
                    type="button"
                    style={s.btnGhost}
                    onClick={async () => {
                      const idJaula = window.prompt(
                        'ID jaula de retorno del macho (reproductores)'
                      );
                      if (!idJaula) return;
                      try {
                        await api.post(`/cuyes/breedings/${e.id}/close`, {
                          id_jaula_retorno: Number(idJaula),
                        });
                        setOk(`Empadre #${e.id} cerrado · macho retornado`);
                      } catch (err) {
                        setError(err.response?.data?.error || 'No se pudo cerrar');
                      }
                    }}
                  >
                    Cerrar y devolver macho
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Empadres;
