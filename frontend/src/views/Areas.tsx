'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';
import { CheckOption, FormModal, ModalSection, fieldFull, fieldLabel } from '@/components/FormModal';
import { propositoLabel } from '@/lib/areas';

const emptyForm = () => ({ nombre: '', proposito: '', jaula_ids: [] as number[] });

/** Áreas: grupos de jaulas de la granja (ej. Línea criolla, Destete). */
const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [jaulas, setJaulas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState<null | { mode: 'crear' } | { mode: 'editar'; area: any }>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const [a, r, j] = await Promise.all([api.get('/areas'), api.get('/areas/summary'), api.get('/recintos')]);
      setAreas(a.data);
      setResumen(r.data);
      setJaulas(j.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las áreas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const jaulasPorArea = useMemo(() => {
    const map: Record<number, any[]> = {};
    resumen.forEach((r) => {
      map[r.id] = r.jaulas || [];
    });
    return map;
  }, [resumen]);

  const areaEditadaId = modal?.mode === 'editar' ? modal.area.id : null;

  const jaulasDisponibles = useMemo(
    () =>
      jaulas
        .filter((j) => j.id_area == null || j.id_area === areaEditadaId)
        .sort((a, b) => {
          const aPropia = a.id_area === areaEditadaId ? 0 : 1;
          const bPropia = b.id_area === areaEditadaId ? 0 : 1;
          if (aPropia !== bPropia) return aPropia - bPropia;
          return String(a.codigo).localeCompare(String(b.codigo), 'es', { numeric: true });
        }),
    [jaulas, areaEditadaId]
  );

  const abrirCrear = () => {
    setError('');
    setOk('');
    setForm(emptyForm());
    setModal({ mode: 'crear' });
  };

  const abrirEditar = (a) => {
    setError('');
    setOk('');
    setForm({
      nombre: a.nombre,
      proposito: a.proposito ? propositoLabel(a.proposito) : '',
      jaula_ids: jaulas.filter((j) => j.id_area === a.id).map((j) => j.id),
    });
    setModal({ mode: 'editar', area: a });
  };

  const cerrarModal = useCallback(() => setModal(null), []);

  const toggleJaula = (id: number) => {
    setForm((f) => ({
      ...f,
      jaula_ids: f.jaula_ids.includes(id) ? f.jaula_ids.filter((x) => x !== id) : [...f.jaula_ids, id],
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      if (modal?.mode === 'editar') {
        await api.patch(`/areas/${modal.area.id}`, form);
        setOk('Área actualizada');
      } else {
        const res = await api.post('/areas', form);
        setOk(res.data?.reactivada ? 'Área reactivada' : 'Área creada');
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const eliminar = async (a) => {
    setError('');
    setOk('');
    const aviso = a.jaulas > 0 ? `\nSus ${a.jaulas} jaula(s) quedarán sin área.` : '';
    if (!window.confirm(`¿Eliminar ${a.nombre}?${aviso}`)) return;
    try {
      await api.patch(`/areas/${a.id}/deactivate`);
      setOk(`${a.nombre} eliminada`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const modalAbierto = !!modal;

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ ...s.title, marginBottom: '0.35rem' }}>Áreas</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>Grupos de jaulas de la granja.</p>
        </div>
        <button type="button" style={{ ...s.btn, marginTop: '0.25rem' }} onClick={abrirCrear}>
          + Nueva área
        </button>
      </div>
      {error && !modalAbierto && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {modal && (
        <FormModal
          title={modal.mode === 'editar' ? 'Editar área' : 'Nueva área'}
          onClose={cerrarModal}
          onSubmit={guardar}
          error={error}
          submitLabel={modal.mode === 'editar' ? 'Guardar' : 'Crear área'}
        >
          <ModalSection step={1} title="Datos del área">
            <label style={fieldLabel}>Nombre</label>
            <input
              style={fieldFull}
              required
              autoFocus
              placeholder="Ej. Línea criolla"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <div style={{ marginTop: '0.85rem' }}>
              <label style={fieldLabel}>Propósito (opcional)</label>
              <input
                style={fieldFull}
                maxLength={50}
                placeholder="Ej. Destete, reproducción, engorde…"
                value={form.proposito}
                onChange={(e) => setForm({ ...form, proposito: e.target.value })}
              />
            </div>
          </ModalSection>

          <ModalSection step={2} title="Jaulas" hint={modal.mode === 'editar' ? 'Jaulas de esta área y jaulas libres.' : 'Solo aparecen las jaulas libres.'}>
            {jaulasDisponibles.length === 0 ? (
              <span style={{ fontSize: '0.9rem' }}>No hay jaulas libres. Créelas en la pantalla Jaulas.</span>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                {jaulasDisponibles.map((j) => (
                  <CheckOption
                    key={j.id}
                    checked={form.jaula_ids.includes(j.id)}
                    onChange={() => toggleJaula(j.id)}
                    label={j.codigo}
                  />
                ))}
              </div>
            )}
          </ModalSection>
        </FormModal>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Área</th>
              <th style={s.th}>Propósito</th>
              <th style={s.th}>Jaulas</th>
              <th style={s.th}>Animales</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {areas.length === 0 && (
              <tr>
                <td style={{ ...s.td, color: theme.muted }} colSpan={5}>
                  Aún no hay áreas.
                </td>
              </tr>
            )}
            {areas.map((a) => {
              const js = jaulasPorArea[a.id] || [];
              return (
                <tr key={a.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{a.nombre}</td>
                  <td style={s.td}>{propositoLabel(a.proposito)}</td>
                  <td style={s.td}>
                    {js.length === 0 ? (
                      <span style={{ color: theme.muted }}>Sin jaulas</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {js.map((j) => (
                          <span
                            key={j.id}
                            title={`${j.ocupacion} animal(es)${j.capacidad_maxima != null ? ` de ${j.capacidad_maxima}` : ''}`}
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: 999,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              background: Number(j.ocupacion) === 0 ? theme.cream : 'rgba(122, 18, 22, 0.08)',
                              border: `1px solid ${theme.border}`,
                              color: theme.ink,
                            }}
                          >
                            {j.codigo}
                            {j.capacidad_maxima != null ? ` · ${j.ocupacion}/${j.capacidad_maxima}` : ` · ${j.ocupacion}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={s.td}>{a.animales}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowOutline }} onClick={() => abrirEditar(a)}>
                        Editar
                      </button>
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowDanger }} onClick={() => eliminar(a)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Areas;
