'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';
import { ChoiceChips, FormModal, ModalSection, fieldFull, fieldLabel } from '@/components/FormModal';

const emptyForm = () => ({
  nombre: '',
  id_especie: null as number | null,
  ubicacion: '',
});

const formatEspecie = (name?: string) => (name ? name.charAt(0).toUpperCase() + name.slice(1) : '—');

/** Administrar granjas (el acceso de usuarios se asigna desde Usuarios) */
const Granjas = () => {
  const { user } = useAuth();
  const [granjas, setGranjas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', ubicacion: '' });

  const esSuper = user?.rol === 'superadmin';

  const load = useCallback(async () => {
    try {
      const g = await api.get('/farms');
      setGranjas(g.data);
      if (esSuper) {
        const e = await api.get('/species');
        setEspecies(e.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar granjas');
    }
  }, [esSuper]);

  useEffect(() => {
    load();
  }, [load]);

  const abrirCrear = () => {
    setError('');
    setForm(emptyForm());
    setCreateOpen(true);
  };

  const cerrarCrear = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (!form.id_especie) {
      setError('Seleccione una especie.');
      return;
    }
    try {
      const res = await api.post('/farms', form);
      setOk(res.data?.reactivada ? 'Granja reactivada' : 'Granja creada');
      setCreateOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    }
  };

  const abrirEditar = (g) => {
    setError('');
    setOk('');
    setEditForm({ nombre: g.nombre, ubicacion: g.ubicacion || '' });
    setEditing(g);
  };

  const cerrarEditar = useCallback(() => {
    setEditing(null);
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.patch(`/farms/${editing.id}`, editForm);
      setOk('Granja actualizada');
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const eliminar = async (g) => {
    if (!window.confirm(`¿Eliminar ${g.nombre}?`)) return;
    setError('');
    setOk('');
    try {
      await api.patch(`/farms/${g.id}/deactivate`);
      setOk(`${g.nombre} eliminada`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ ...s.title, marginBottom: '0.35rem' }}>Granjas</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>Granjas registradas en el sistema.</p>
        </div>
        {esSuper && (
          <button type="button" style={{ ...s.btn, marginTop: '0.25rem' }} onClick={abrirCrear}>
            + Nueva granja
          </button>
        )}
      </div>
      {error && !createOpen && !editing && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {createOpen && (
        <FormModal
          title="Nueva granja"
          onClose={cerrarCrear}
          onSubmit={crear}
          error={error}
          submitLabel="Crear granja"
        >
          <ModalSection title="Datos de la granja">
            <label style={fieldLabel}>Nombre</label>
            <input
              style={fieldFull}
              required
              autoFocus
              placeholder="Ej. Granja Cuyes 3"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <div style={{ marginTop: '0.85rem' }}>
              <label style={fieldLabel}>Especie</label>
              {especies.length === 0 ? (
                <span style={{ fontSize: '0.9rem' }}>No hay especies registradas.</span>
              ) : (
                <ChoiceChips
                  options={especies.map((e) => ({ value: e.id, label: formatEspecie(e.name) }))}
                  value={form.id_especie}
                  onChange={(id_especie) => setForm({ ...form, id_especie })}
                />
              )}
            </div>
            <div style={{ marginTop: '0.85rem' }}>
              <label style={fieldLabel}>Ubicación (opcional)</label>
              <input
                style={fieldFull}
                placeholder="Ej. Tingo María"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              />
            </div>
          </ModalSection>
        </FormModal>
      )}

      {editing && (
        <FormModal
          title="Editar granja"
          onClose={cerrarEditar}
          onSubmit={guardar}
          error={error}
          submitLabel="Guardar"
        >
          <ModalSection title="Datos de la granja">
            <label style={fieldLabel}>Nombre</label>
            <input
              style={fieldFull}
              required
              autoFocus
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
            />
            <div style={{ marginTop: '0.85rem' }}>
              <label style={fieldLabel}>Ubicación (opcional)</label>
              <input
                style={fieldFull}
                placeholder="Ej. Tingo María"
                value={editForm.ubicacion}
                onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })}
              />
            </div>
          </ModalSection>
        </FormModal>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Especie</th>
              <th style={s.th}>Ubicación</th>
              {esSuper && <th style={s.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {granjas.map((g) => (
              <tr key={g.id}>
                <td style={s.td}>{g.nombre}</td>
                <td style={s.td}>{formatEspecie(g.especie)}</td>
                <td style={s.td}>{g.ubicacion || '—'}</td>
                {esSuper && (
                  <td style={s.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowOutline }} onClick={() => abrirEditar(g)}>
                        Editar
                      </button>
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowDanger }} onClick={() => eliminar(g)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Granjas;
