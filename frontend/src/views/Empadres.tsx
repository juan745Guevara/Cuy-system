'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { clearDraft, loadDraft, saveDraft } from '@/lib/draftForm';

const DRAFT_KEY = 'draft:empadres:wizard';

const emptyForm = () => ({
  id_macho: '',
  hembras: [] as number[],
  id_jaula: '',
  fecha_empadre: new Date().toISOString().slice(0, 10),
  cantidad_prenadas: '',
  peso_antes: '',
  peso_despues: '',
  notas: '',
});

const Empadres = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hembras, setHembras] = useState<any[]>([]);
  const [machos, setMachos] = useState<any[]>([]);
  const [jaulas, setJaulas] = useState<any[]>([]);
  const [filtroJaula, setFiltroJaula] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState<any>(() => loadDraft(DRAFT_KEY) || emptyForm());
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, m, j] = await Promise.all([
        api.get('/animals', { params: { sexo: 'H', estado: 'activo' } }),
        api.get('/animals', { params: { sexo: 'M', estado: 'activo' } }),
        api.get('/recintos'),
      ]);
      setHembras(h.data.data || h.data);
      setMachos(m.data.data || m.data);
      setJaulas(j.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
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

  const toggleHembra = (id: number) => {
    setForm((f: any) => ({
      ...f,
      hembras: f.hembras.includes(id) ? f.hembras.filter((x: number) => x !== id) : [...f.hembras, id],
    }));
  };

  const validarPaso1 = () => {
    setError('');
    if (!form.fecha_empadre) return 'Debe indicar fecha de empadre';
    const hoy = new Date().toISOString().slice(0, 10);
    if (form.fecha_empadre > hoy) return 'La fecha de empadre no puede ser futura';
    if (form.hembras.length === 0) return 'Debe seleccionar al menos una hembra';
    return null;
  };

  const siguientePaso1 = () => {
    const v = validarPaso1();
    if (v) {
      setError(v);
      return;
    }
    setStep(2);
    setError('');
  };

  const confirmar = async () => {
    setError('');
    setOk('');
    setLoading(true);
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
      setResult(data);
      clearDraft(DRAFT_KEY);
      setStep(3);
      setOk('Empadre # registrado');
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo registrar empadre');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setForm(emptyForm());
    setResult(null);
    setError('');
    setOk('');
  };

  const machoSel = machos.find((m) => String(m.id) === String(form.id_macho));
  const jaulaSel = jaulas.find((j) => String(j.id) === String(form.id_jaula));

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Empadres</h1>
      <p style={s.sub}>Wizard de registro de empadre</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={{ ...s.card, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: step >= 1 ? '#4F0C10' : '#7A6358' }}>Paso 1: Selección</div>
          <div style={{ fontSize: '0.9rem', color: '#7A6358' }}>Reproductoras/reproductores + fechas</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: step >= 2 ? '#4F0C10' : '#7A6358' }}>Paso 2: Confirmación</div>
          <div style={{ fontSize: '0.9rem', color: '#7A6358' }}>Revisar datos antes de registrar</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: step >= 3 ? '#4F0C10' : '#7A6358' }}>Paso 3: Resultados</div>
          <div style={{ fontSize: '0.9rem', color: '#7A6358' }}>Resumen del registro</div>
        </div>
      </div>

      {step === 1 && (
        <div style={s.card}>
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
                setForm((f: any) => ({ ...f, id_jaula: id }));
                setFiltroJaula(id);
                if (!id) return;
                try {
                  const { data } = await api.get(`/cuyes/breedings/cage/${id}/females`);
                  setForm((f: any) => ({
                    ...f,
                    id_jaula: id,
                    hembras: data.map((h: any) => h.id),
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
                  {j.area ? `${j.area} / ` : ''}
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
                <option key={j.id} value={j.id}>
                  {j.codigo}
                </option>
              ))}
            </select>
          </div>
          <p>Hembras ({form.hembras.length} seleccionadas):</p>
          <div style={s.row}>
            {hembrasVisibles.length === 0 && <span style={{ color: '#7A6358' }}>Sin hembras para el filtro</span>}
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
          </div>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button type="button" style={s.btn} onClick={siguientePaso1} disabled={loading}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Confirmación de datos de empadre</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Fecha:</strong> {form.fecha_empadre}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Macho:</strong> {machoSel ? machoSel.codigo : 'Sin especificar'}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Jaula:</strong> {jaulaSel ? (jaulaSel.area ? `${jaulaSel.area} / ` : '') + jaulaSel.codigo : 'Sin especificar'}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Hembras seleccionadas ({form.hembras.length}):</strong>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {form.hembras.map((id: number) => {
                const h = hembras.find((x) => x.id === id);
                return (
                  <span key={id} style={{ ...s.btnGhost, cursor: 'default' }}>
                    {h?.codigo || id}
                  </span>
                );
              })}
            </div>
          </div>
          {form.cantidad_prenadas !== '' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Cantidad preñadas:</strong> {form.cantidad_prenadas}
            </div>
          )}
          {form.peso_antes !== '' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Peso antes:</strong> {form.peso_antes}
            </div>
          )}
          {form.peso_despues !== '' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Peso después:</strong> {form.peso_despues}
            </div>
          )}
          {form.notas && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Notas:</strong> {form.notas}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <button type="button" style={s.btnGhost} onClick={() => setStep(1)} disabled={loading}>
              Volver
            </button>
            <button type="button" style={s.btn} onClick={confirmar} disabled={loading}>
              {loading ? 'Registrando...' : 'Confirmar y registrar'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Resultados / Resumen</h3>
          {result ? (
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Empadre #:</strong> {result.id}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Fecha:</strong> {result.fecha_empadre || form.fecha_empadre}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Hembras:</strong> {(result.hembras || form.hembras).join(', ')}
              </div>
              {result.cantidad_prenadas != null && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Cantidad preñadas:</strong> {result.cantidad_prenadas}
                </div>
              )}
              {result.id_macho && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Macho ID:</strong> {result.id_macho}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" style={s.btn} onClick={resetWizard}>
                  Registrar nuevo empadre
                </button>
              </div>
            </div>
          ) : (
            <div>No hay resultado</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Empadres;
