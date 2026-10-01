'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';
import {
  CheckOption,
  ChoiceChips,
  FormModal,
  ModalSection,
  fieldFull,
  fieldLabel,
} from '@/components/FormModal';

const formatModulo = (name?: string) => {
  if (!name) return '—';
  const n = name.toLowerCase();
  if (n === 'cuyes') return 'Cuyes';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  supervisor: 'Supervisor',
  auxiliar: 'Auxiliar',
};

/** Gestión de usuarios con alcance por granja */
const Usuarios = () => {
  const { user } = useAuth();
  const esSuper = user?.rol === 'superadmin';
  const [lista, setLista] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [modulos, setModulos] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
  } | null>(null);
  const editandoSuper = editUser?.rol === 'superadmin';
  const emptyCreateForm = () => ({
    nombre: '',
    email: '',
    password: '',
    rol: user?.rol === 'superadmin' ? 'admin' : 'encargado',
    especie_ids: [] as number[],
    granja_ids: [] as number[],
  });
  const [form, setForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({
    activo: true,
    especie_ids: [] as number[],
    granja_ids: [] as number[],
    password: '',
  });

  const puedeAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const load = useCallback(async () => {
    if (!puedeAdmin) return;
    try {
      const reqs = [api.get('/users'), api.get('/farms')];
      if (esSuper) reqs.push(api.get('/species'));
      const results = await Promise.all(reqs);
      setLista(results[0].data);
      setGranjas(results[1].data);
      if (esSuper && results[2]) setModulos(results[2].data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar usuarios');
    }
  }, [puedeAdmin, esSuper]);

  useEffect(() => {
    load();
  }, [load]);

  const granjaMeta = useMemo(
    () => Object.fromEntries(granjas.map((g) => [g.id, g])),
    [granjas],
  );

  const modulosDeUsuario = (u) => {
    const names = new Set<string>();
    (u.granjas || []).forEach((g) => {
      const esp = granjaMeta[g.id]?.especie;
      if (esp) names.add(formatModulo(esp));
    });
    return [...names].join(', ') || '—';
  };

  const toggleModulo = (especieId: number, target: 'create' | 'edit' = 'create') => {
    const apply = <T extends { especie_ids: number[]; granja_ids: number[] }>(f: T): T => {
      const on = f.especie_ids.includes(especieId);
      const especie_ids = on
        ? f.especie_ids.filter((x) => x !== especieId)
        : [...f.especie_ids, especieId];
      const granja_ids = on
        ? f.granja_ids.filter((gid) => granjaMeta[gid]?.id_especie !== especieId)
        : f.granja_ids;
      return { ...f, especie_ids, granja_ids };
    };
    if (target === 'create') setForm((f) => apply(f));
    else setEditForm((f) => apply(f));
  };

  const toggleGranja = (id, target = 'create') => {
    if (target === 'create') {
      setForm((f) => ({
        ...f,
        granja_ids: f.granja_ids.includes(id)
          ? f.granja_ids.filter((x) => x !== id)
          : [...f.granja_ids, id],
      }));
    } else {
      setEditForm((f) => ({
        ...f,
        granja_ids: f.granja_ids.includes(id)
          ? f.granja_ids.filter((x) => x !== id)
          : [...f.granja_ids, id],
      }));
    }
  };

  const cerrarCrear = () => {
    setCreateOpen(false);
    setForm(emptyCreateForm());
  };

  const abrirCrear = () => {
    setError('');
    setForm(emptyCreateForm());
    setCreateOpen(true);
  };

  const cerrarEditar = () => {
    setEditId(null);
    setEditUser(null);
    setEditForm({ activo: true, especie_ids: [], granja_ids: [], password: '' });
  };

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (esSuper) {
      if (!form.especie_ids.length) {
        setError('Seleccione al menos un módulo.');
        return;
      }
      if (!form.granja_ids.length) {
        setError('Seleccione al menos una granja.');
        return;
      }
      for (const sid of form.especie_ids) {
        const tiene = form.granja_ids.some(
          (gid) => granjaMeta[gid]?.id_especie === sid,
        );
        if (!tiene) {
          setError(
            `Marque al menos una granja del módulo ${formatModulo(modulos.find((m) => m.id === sid)?.name)}.`,
          );
          return;
        }
      }
    }
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        granja_ids: form.granja_ids.map(Number),
      };
      if (esSuper) payload.especie_ids = form.especie_ids.map(Number);
      const res = await api.post('/users', payload);
      setOk(
        res.data?.reactivada
          ? 'Cuenta reactivada'
          : 'Usuario creado',
      );
      cerrarCrear();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el usuario');
    }
  };

  const abrirEditar = (u) => {
    const granja_ids = (u.granjas || []).map((g) => g.id);
    const especie_ids: number[] = esSuper
      ? ([
          ...new Set(
            granja_ids
              .map((gid) => granjaMeta[gid]?.id_especie)
              .filter((id): id is number => typeof id === 'number'),
          ),
        ] as number[])
      : [];
    setEditId(u.id);
    setEditUser({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });
    setEditForm({
      activo: u.activo !== false,
      especie_ids,
      granja_ids,
      password: '',
    });
    setError('');
    setOk('');
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setError('');
    setOk('');
    if (editandoSuper) {
      if (!editForm.password.trim()) {
        setError('Escriba la nueva contraseña.');
        return;
      }
      try {
        await api.patch(`/users/${editId}`, { password: editForm.password });
        setOk('Contraseña actualizada');
        cerrarEditar();
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo actualizar');
      }
      return;
    }
    if (esSuper) {
      if (!editForm.especie_ids.length) {
        setError('Seleccione al menos un módulo.');
        return;
      }
      if (!editForm.granja_ids.length) {
        setError('Seleccione al menos una granja.');
        return;
      }
      for (const sid of editForm.especie_ids) {
        const tiene = editForm.granja_ids.some(
          (gid) => granjaMeta[gid]?.id_especie === sid,
        );
        if (!tiene) {
          setError(
            `Marque al menos una granja del módulo ${formatModulo(modulos.find((m) => m.id === sid)?.name)}.`,
          );
          return;
        }
      }
    }
    try {
      const body: Record<string, unknown> = {
        activo: editForm.activo,
        granja_ids: editForm.granja_ids.map(Number),
      };
      if (editForm.password.trim()) body.password = editForm.password;
      await api.patch(`/users/${editId}`, body);
      setOk('Usuario actualizado');
      cerrarEditar();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const eliminarUsuario = async (u) => {
    if (u.rol === 'superadmin') {
      setError('La cuenta superadmin no se puede eliminar.');
      return;
    }
    const okConfirm = window.confirm(
      `¿Eliminar a ${u.nombre}?`,
    );
    if (!okConfirm) return;
    setError('');
    setOk('');
    try {
      await api.patch(`/users/${u.id}`, {
        activo: false,
        granja_ids: (u.granjas || []).map((g) => g.id),
      });
      setOk(`${u.nombre} eliminado`);
      if (editId === u.id) cerrarEditar();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la cuenta');
    }
  };

  if (!puedeAdmin) {
    return (
      <div style={s.wrap}>
        <h1 style={s.title}>Usuarios</h1>
        <div style={s.error}>Solo admin / superadmin pueden gestionar cuentas.</div>
      </div>
    );
  }

  const roles =
    user.rol === 'superadmin'
      ? ['admin', 'encargado', 'supervisor', 'auxiliar']
      : ['encargado', 'supervisor', 'auxiliar'];

  const granjasEnModulosSeleccionados = esSuper
    ? granjas.filter(
        (g) =>
          form.especie_ids.length > 0 &&
          form.especie_ids.includes(g.id_especie),
      )
    : granjas;

  const granjasEnModulosEdit = esSuper
    ? granjas.filter(
        (g) =>
          editForm.especie_ids.length > 0 &&
          editForm.especie_ids.includes(g.id_especie),
      )
    : granjas;

  const granjasPicker = (
    f: { especie_ids: number[]; granja_ids: number[] },
    visibles: typeof granjas,
    target: 'create' | 'edit',
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
      {esSuper && f.especie_ids.length === 0 ? (
        <span style={{ color: theme.muted, fontSize: '0.9rem', padding: '0.35rem 0' }}>Primero elija un módulo.</span>
      ) : visibles.length === 0 ? (
        <span style={{ color: theme.muted, fontSize: '0.9rem', padding: '0.35rem 0' }}>No hay granjas en este módulo.</span>
      ) : esSuper ? (
        f.especie_ids.map((sid) => {
          const mod = modulos.find((m) => m.id === sid);
          const list = visibles.filter((g) => g.id_especie === sid);
          if (!list.length) return null;
          return (
            <div key={sid} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: theme.maroonSoft,
                  margin: '0.35rem 0.45rem 0.25rem',
                }}
              >
                {formatModulo(mod?.name)}
              </div>
              {list.map((g) => (
                <CheckOption
                  key={g.id}
                  checked={f.granja_ids.includes(g.id)}
                  onChange={() => toggleGranja(g.id, target)}
                  label={g.nombre}
                />
              ))}
            </div>
          );
        })
      ) : (
        granjas.map((g) => (
          <CheckOption
            key={g.id}
            checked={f.granja_ids.includes(g.id)}
            onChange={() => toggleGranja(g.id, target)}
            label={g.nombre}
            hint={g.especie ? formatModulo(g.especie) : undefined}
          />
        ))
      )}
    </div>
  );

  const modulosPicker = (f: { especie_ids: number[] }, target: 'create' | 'edit') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
      {modulos.length === 0 ? (
        <span style={{ color: theme.muted, fontSize: '0.9rem' }}>No hay módulos registrados.</span>
      ) : (
        modulos.map((m) => (
          <CheckOption
            key={m.id}
            checked={f.especie_ids.includes(m.id)}
            onChange={() => toggleModulo(m.id, target)}
            label={formatModulo(m.name)}
          />
        ))
      )}
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ ...s.title, marginBottom: '0.35rem' }}>Usuarios</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>Cuentas con acceso al sistema.</p>
        </div>
        <button type="button" style={{ ...s.btn, marginTop: '0.25rem' }} onClick={abrirCrear}>
          + Crear usuario
        </button>
      </div>
      {error && !createOpen && !editId && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      {createOpen && (
        <FormModal
          title="Nueva cuenta"
          onClose={cerrarCrear}
          onSubmit={crear}
          error={error}
          submitLabel="Crear usuario"
        >
          <ModalSection step={1} title="Datos de acceso">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={fieldLabel}>Nombre</label>
                <input
                  style={fieldFull}
                  required
                  autoFocus
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label style={fieldLabel}>Email</label>
                <input
                  style={fieldFull}
                  required
                  type="email"
                  placeholder="correo@unas.edu.pe"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <label style={fieldLabel}>Contraseña</label>
              <input
                style={fieldFull}
                required
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </ModalSection>

          <ModalSection step={2} title="Rol">
            <ChoiceChips
              options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }))}
              value={form.rol}
              onChange={(rol) => setForm({ ...form, rol })}
            />
          </ModalSection>

          {esSuper && (
            <ModalSection step={3} title="Módulos">
              {modulosPicker(form, 'create')}
            </ModalSection>
          )}

          <ModalSection step={esSuper ? 4 : 3} title="Granjas" hint={esSuper ? 'Al menos una por módulo.' : undefined}>
            {granjasPicker(form, granjasEnModulosSeleccionados, 'create')}
          </ModalSection>
        </FormModal>
      )}

      {editId && editUser && (
        <FormModal
          title="Editar cuenta"
          subtitle={
            <>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: theme.ink, fontWeight: 600 }}>
                {editUser.nombre}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: theme.muted }}>
                {editUser.email} · {ROLE_LABELS[editUser.rol] || editUser.rol}
              </p>
            </>
          }
          onClose={cerrarEditar}
          onSubmit={guardarEdicion}
          error={error}
          submitLabel="Guardar cambios"
        >
          <ModalSection step={editandoSuper ? undefined : 1} title="Acceso">
            {!editandoSuper && (
              <div style={{ marginBottom: '0.85rem' }}>
                <CheckOption
                  checked={editForm.activo}
                  onChange={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                  label="Cuenta activa"
                />
              </div>
            )}
            <label style={fieldLabel}>{editandoSuper ? 'Nueva contraseña' : 'Nueva contraseña (opcional)'}</label>
            <input
              style={fieldFull}
              type="password"
              placeholder={editandoSuper ? '' : 'Dejar vacío para no cambiar'}
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </ModalSection>

          {esSuper && !editandoSuper && (
            <ModalSection step={2} title="Módulos">
              {modulosPicker(editForm, 'edit')}
            </ModalSection>
          )}

          {!editandoSuper && (
            <ModalSection step={esSuper ? 3 : 2} title="Granjas" hint={esSuper ? 'Al menos una por módulo.' : undefined}>
              {granjasPicker(editForm, granjasEnModulosEdit, 'edit')}
            </ModalSection>
          )}
        </FormModal>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Rol</th>
              <th style={s.th}>Activo</th>
              {esSuper && <th style={s.th}>Módulos</th>}
              <th style={s.th}>Granjas</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id}>
                <td style={s.td}>{u.nombre}</td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>{u.rol}</td>
                <td style={s.td}>
                  {u.activo === false ? (
                    <span style={{ color: theme.muted, fontWeight: 600 }}>Inactivo</span>
                  ) : (
                    'Activo'
                  )}
                </td>
                {esSuper && <td style={s.td}>{modulosDeUsuario(u)}</td>}
                <td style={s.td}>{(u.granjas || []).map((g) => g.nombre).join(', ') || '—'}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {(u.rol !== 'superadmin' || u.id === user?.id) && (
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowOutline }} onClick={() => abrirEditar(u)}>
                        Editar
                      </button>
                    )}
                    {u.rol !== 'superadmin' && u.activo !== false && (
                      <button type="button" style={{ ...s.btnRow, ...s.btnRowDanger }} onClick={() => eliminarUsuario(u)}>
                        Eliminar
                      </button>
                    )}
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

export default Usuarios;
