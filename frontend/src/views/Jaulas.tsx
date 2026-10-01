'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';
import { propositoLabel } from '@/lib/areas';
import { FormModal, ModalSection, SelectField, fieldFull, fieldLabel } from '@/components/FormModal';

const emptyForm = () => ({ codigo: '', capacidad: '', id_area: null as number | null });

/** Jaulas de la granja · control de capacidad. El área es opcional. */
const Jaulas = () => {
  const [jaulas, setJaulas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState<null | { mode: 'crear' } | { mode: 'editar'; jaula: any }>(null);
  const [form, setForm] = useState(emptyForm);
  const [ocupantes, setOcupantes] = useState<null | { jaula: any; data: any[] }>(null);

  const load = useCallback(async () => {
    try {
      const [j, a] = await Promise.all([api.get('/recintos'), api.get('/areas')]);
      setJaulas(j.data);
      setAreas(a.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las jaulas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const abrirCrear = () => {
    setError('');
    setOk('');
    setForm(emptyForm());
    setModal({ mode: 'crear' });
  };

  const abrirEditar = (j) => {
    setError('');
    setOk('');
    setForm({
      codigo: j.codigo,
      capacidad: j.capacidad_maxima != null ? String(j.capacidad_maxima) : '',
      id_area: j.id_area ?? null,
    });
    setModal({ mode: 'editar', jaula: j });
  };

  const cerrarModal = useCallback(() => setModal(null), []);
  const cerrarOcupantes = useCallback(() => setOcupantes(null), []);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const body = {
      codigo: form.codigo.trim(),
      capacidad_maxima: form.capacidad ? Number(form.capacidad) : null,
      id_area: form.id_area,
    };
    try {
      if (modal?.mode === 'editar') {
        await api.patch(`/recintos/${modal.jaula.id}`, body);
        setOk(`Jaula ${body.codigo} actualizada`);
      } else {
        await api.post('/recintos', body);
        setOk(`Jaula ${body.codigo} creada`);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const eliminar = async (j) => {
    setError('');
    setOk('');
    if (!window.confirm(`¿Eliminar la jaula ${j.codigo}?`)) return;
    try {
      await api.patch(`/recintos/${j.id}/deactivate`);
      setOk(`Jaula ${j.codigo} eliminada`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const verAnimales = async (j) => {
    setError('');
    try {
      const { data } = await api.get(`/recintos/${j.id}/animals`);
      setOcupantes({ jaula: j, data });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los animales');
    }
  };

  const sobrecupo = jaulas.filter(
    (j) => j.capacidad_maxima != null && Number(j.ocupacion) > Number(j.capacidad_maxima)
  );

  const ocupLabel = (j) => {
    const occ = j.ocupacion ?? 0;
    return j.capacidad_maxima != null ? `${occ} / ${j.capacidad_maxima}` : String(occ);
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ ...s.title, marginBottom: '0.35rem' }}>Jaulas</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>Jaulas de la granja.</p>
        </div>
        <button type="button" style={{ ...s.btn, marginTop: '0.25rem' }} onClick={abrirCrear}>
          + Nueva jaula
        </button>
      </div>
      {error && !modal && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {sobrecupo.length > 0 && (
        <div style={s.error}>
          Jaulas que superan su capacidad:{' '}
          {sobrecupo.map((j) => `${j.codigo} (${j.ocupacion}/${j.capacidad_maxima})`).join(' · ')}
        </div>
      )}

      {modal && (
        <FormModal
          title={modal.mode === 'editar' ? 'Editar jaula' : 'Nueva jaula'}
          onClose={cerrarModal}
          onSubmit={guardar}
          error={error}
          submitLabel={modal.mode === 'editar' ? 'Guardar' : 'Crear jaula'}
        >
          <ModalSection title="Datos de la jaula">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={fieldLabel}>Código</label>
                <input
                  style={fieldFull}
                  required
                  autoFocus
                  placeholder="Ej. LC-01"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                />
              </div>
              <div>
                <label style={fieldLabel}>Capacidad máxima (opcional)</label>
                <input
                  style={fieldFull}
                  type="number"
                  min="1"
                  placeholder="Ej. 10"
                  value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: '0.85rem' }}>
              <label style={fieldLabel}>Área</label>
              <SelectField
                options={[
                  { value: 0, label: 'Sin área' },
                  ...areas.map((a) => {
                    const prop = a.proposito ? propositoLabel(a.proposito) : '';
                    return {
                      value: a.id as number,
                      label: a.nombre,
                      hint: prop && prop.toLowerCase() !== String(a.nombre).toLowerCase() ? prop : undefined,
                    };
                  }),
                ]}
                value={form.id_area ?? 0}
                onChange={(v) => setForm({ ...form, id_area: v === 0 ? null : v })}
              />
            </div>
          </ModalSection>
        </FormModal>
      )}

      {ocupantes && (
        <FormModal
          title={`Animales en ${ocupantes.jaula.codigo}`}
          onClose={cerrarOcupantes}
          onSubmit={(e) => {
            e.preventDefault();
            cerrarOcupantes();
          }}
          submitLabel="Cerrar"
          showCancel={false}
        >
          {ocupantes.data.length === 0 ? (
            <p style={{ margin: '0 0 1rem', color: theme.muted }}>La jaula está vacía.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
              {ocupantes.data.map((a) => (
                <span
                  key={a.id}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: 999,
                    border: `1px solid ${theme.border}`,
                    background: theme.cream,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  {a.codigo} · {a.sexo === 'H' ? 'Hembra' : a.sexo === 'M' ? 'Macho' : a.sexo}
                </span>
              ))}
            </div>
          )}
        </FormModal>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Código</th>
              <th style={s.th}>Área</th>
              <th style={s.th}>Propósito</th>
              <th style={s.th}>Ocupación</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {jaulas.length === 0 && (
              <tr>
                <td style={{ ...s.td, color: theme.muted }} colSpan={5}>
                  Aún no hay jaulas.
                </td>
              </tr>
            )}
            {jaulas.map((j) => (
              <tr key={j.id}>
                <td style={{ ...s.td, fontWeight: 600 }}>{j.codigo}</td>
                <td style={s.td}>{j.area || <span style={{ color: theme.muted }}>Sin área</span>}</td>
                <td style={s.td}>{propositoLabel(j.proposito)}</td>
                <td style={s.td}>{ocupLabel(j)}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <button type="button" style={{ ...s.btnRow, ...s.btnRowOutline }} onClick={() => verAnimales(j)}>
                      Ver animales
                    </button>
                    <button type="button" style={{ ...s.btnRow, ...s.btnRowOutline }} onClick={() => abrirEditar(j)}>
                      Editar
                    </button>
                    <button type="button" style={{ ...s.btnRow, ...s.btnRowDanger }} onClick={() => eliminar(j)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Jaulas;
