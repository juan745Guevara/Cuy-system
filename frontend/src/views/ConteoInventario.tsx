'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';

/** Mensaje en español según el campo que el backend rechazó. */
const MENSAJES: Record<string, string> = {
  fecha: 'La fecha no es válida o es futura.',
  id_jaula: 'Seleccione una jaula activa de esta granja.',
  machos_contados: 'Machos contados debe ser un número entero de 0 o más.',
  hembras_contadas: 'Hembras contadas debe ser un número entero de 0 o más.',
  peso_muestra1: 'El peso de la muestra 1 debe ser mayor que cero.',
  peso_muestra2: 'El peso de la muestra 2 debe ser mayor que cero.',
  peso_muestra3: 'El peso de la muestra 3 debe ser mayor que cero.',
  observaciones: 'Faltan animales: indique la posible causa en observaciones.',
};

const hoy = () => new Date().toISOString().slice(0, 10);
const vacio = {
  id_jaula: '',
  machos_contados: '',
  hembras_contadas: '',
  peso_muestra1: '',
  peso_muestra2: '',
  peso_muestra3: '',
  observaciones: '',
};

function colorDiferencia(d: number) {
  if (d < 0) return theme.danger;
  if (d > 0) return theme.warning;
  return theme.success;
}

function textoDiferencia(d: number) {
  if (d === 0) return 'Cuadra con el sistema';
  return d < 0 ? `Faltan ${Math.abs(d)}` : `Sobran ${d}`;
}

/**
 * CU-06 — Toma y conciliación de inventario físico.
 * Se elige una jaula, se ingresa lo contado y el sistema muestra la diferencia con lo registrado.
 */
const ConteoInventario = () => {
  const [jaulas, setJaulas] = useState([]);
  const [conteos, setConteos] = useState([]);
  const [fecha, setFecha] = useState(hoy());
  const [form, setForm] = useState(vacio);
  const [registrado, setRegistrado] = useState<{ machos: number; hembras: number } | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [j, c] = await Promise.all([api.get('/recintos'), api.get('/cuyes/inventory/counts')]);
      setJaulas(j.data || []);
      setConteos(c.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las jaulas y los conteos');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Lo que el sistema tiene registrado en la jaula elegida (por sexo).
  useEffect(() => {
    setRegistrado(null);
    if (!form.id_jaula) return;
    let vigente = true;
    api
      .get(`/recintos/${form.id_jaula}/animals`)
      .then((res) => {
        if (!vigente) return;
        const animales = res.data || [];
        setRegistrado({
          machos: animales.filter((a) => a.sexo === 'M').length,
          hembras: animales.filter((a) => a.sexo === 'H').length,
        });
      })
      .catch(() => vigente && setRegistrado(null));
    return () => {
      vigente = false;
    };
  }, [form.id_jaula]);

  const contados =
    form.machos_contados !== '' && form.hembras_contadas !== ''
      ? Number(form.machos_contados) + Number(form.hembras_contadas)
      : null;
  const diferencia = useMemo(
    () => (registrado && contados !== null ? contados - (registrado.machos + registrado.hembras) : null),
    [registrado, contados],
  );

  const set = (campo: string) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (diferencia !== null && diferencia < 0 && !form.observaciones.trim()) {
      setError(MENSAJES.observaciones);
      return;
    }
    setGuardando(true);
    try {
      const body = {
        fecha,
        id_jaula: Number(form.id_jaula),
        machos_contados: Number(form.machos_contados),
        hembras_contadas: Number(form.hembras_contadas),
        peso_muestra1: form.peso_muestra1 || null,
        peso_muestra2: form.peso_muestra2 || null,
        peso_muestra3: form.peso_muestra3 || null,
        observaciones: form.observaciones,
      };
      const res = await api.post('/cuyes/inventory/counts', body);
      setOk(`Conteo registrado. ${textoDiferencia(res.data.diferencia)}.`);
      setForm(vacio);
      await cargar();
    } catch (err) {
      const data = err.response?.data;
      setError(MENSAJES[data?.campo] || data?.error || 'No se pudo registrar el conteo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={s.card}>
      <h3 style={{ marginTop: 0 }}>Conteo físico de jaulas</h3>
      <p style={{ ...s.sub, marginBottom: '1rem' }}>
        Registre lo que contó en la jaula; el sistema lo compara con los animales registrados y guarda la
        diferencia.
      </p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={guardar}>
        <div style={s.row}>
          <label>
            Fecha
            <br />
            <input type="date" style={s.input} value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Jaula
            <br />
            <select style={s.select} value={form.id_jaula} onChange={set('id_jaula')} required>
              <option value="">Seleccione…</option>
              {jaulas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.codigo}
                  {j.area ? ` · ${j.area}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Machos contados
            <br />
            <input type="number" min="0" step="1" style={s.input} value={form.machos_contados} onChange={set('machos_contados')} required />
          </label>
          <label>
            Hembras contadas
            <br />
            <input type="number" min="0" step="1" style={s.input} value={form.hembras_contadas} onChange={set('hembras_contadas')} required />
          </label>
        </div>

        {registrado && (
          <p style={{ margin: '0 0 1rem', color: theme.muted }}>
            Registrado en el sistema: <strong>{registrado.machos}</strong> machos y{' '}
            <strong>{registrado.hembras}</strong> hembras ({registrado.machos + registrado.hembras} en total).
            {diferencia !== null && (
              <strong style={{ marginLeft: 8, color: colorDiferencia(diferencia) }}>{textoDiferencia(diferencia)}</strong>
            )}
          </p>
        )}

        <div style={s.row}>
          {[1, 2, 3].map((n) => (
            <label key={n}>
              Peso muestra {n} (g, opcional)
              <br />
              <input
                type="number"
                min="0"
                step="0.1"
                style={s.input}
                value={form[`peso_muestra${n}`]}
                onChange={set(`peso_muestra${n}`)}
              />
            </label>
          ))}
        </div>

        <div style={s.row}>
          <label style={{ flex: 1, minWidth: 'min(320px, 100%)' }}>
            Observaciones {diferencia !== null && diferencia < 0 ? '(obligatorio: faltan animales)' : '(opcional)'}
            <br />
            <input
              type="text"
              style={{ ...s.input, width: '100%' }}
              placeholder="Ej.: muerte no reportada, fuga, error de conteo"
              value={form.observaciones}
              onChange={set('observaciones')}
            />
          </label>
        </div>

        <button type="submit" style={s.btn} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Registrar conteo'}
        </button>
      </form>

      <h4 style={{ margin: '1.5rem 0 0.5rem' }}>Últimos conteos</h4>
      {conteos.length === 0 ? (
        <p style={{ color: theme.muted, margin: 0 }}>Aún no hay conteos registrados.</p>
      ) : (
        <div style={s.tableScroll}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Jaula</th>
                <th style={s.th}>Contado (M/H)</th>
                <th style={s.th}>Sistema (M/H)</th>
                <th style={s.th}>Diferencia</th>
                <th style={s.th}>Peso prom. (g)</th>
                <th style={s.th}>Observaciones</th>
                <th style={s.th}>Registró</th>
              </tr>
            </thead>
            <tbody>
              {conteos.map((c) => (
                <tr key={c.id}>
                  <td style={s.td}>{String(c.fecha).slice(0, 10)}</td>
                  <td style={s.td}>
                    {c.jaula}
                    {c.area ? ` · ${c.area}` : ''}
                  </td>
                  <td style={s.td}>
                    {c.total_contado} ({c.machos_contados}/{c.hembras_contadas})
                  </td>
                  <td style={s.td}>
                    {c.total_sistema} ({c.machos_sistema}/{c.hembras_sistema})
                  </td>
                  <td style={{ ...s.td, fontWeight: 700, color: colorDiferencia(Number(c.diferencia)) }}>
                    {Number(c.diferencia) > 0 ? `+${c.diferencia}` : c.diferencia}
                  </td>
                  <td style={s.td}>{c.peso_promedio ?? '—'}</td>
                  <td style={s.td}>{c.observaciones || '—'}</td>
                  <td style={s.td}>{c.registrado_por || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConteoInventario;
