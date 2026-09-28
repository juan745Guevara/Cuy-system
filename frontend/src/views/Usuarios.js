'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** Gestión de usuarios con alcance por granja */
const Usuarios = () => {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'encargado',
    granja_ids: [],
  });
  const [editForm, setEditForm] = useState({
    activo: true,
    granja_ids: [],
    password: '',
  });

  const puedeAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const load = useCallback(async () => {
    if (!puedeAdmin) return;
    try {
      const [u, g] = await Promise.all([api.get('/users'), api.get('/farms')]);
      setLista(u.data);
      setGranjas(g.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar usuarios');
    }
  }, [puedeAdmin]);

  useEffect(() => {
    load();
  }, [load]);

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

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/users', {
        ...form,
        granja_ids: form.granja_ids.map(Number),
      });
      setOk('Usuario creado');
      setForm({ nombre: '', email: '', password: '', rol: 'encargado', granja_ids: [] });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el usuario');
    }
  };

  const abrirEditar = (u) => {
    setEditId(u.id);
    setEditForm({
      activo: u.activo !== false,
      granja_ids: (u.granjas || []).map((g) => g.id),
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
    try {
      const body = {
        activo: editForm.activo,
        granja_ids: editForm.granja_ids.map(Number),
      };
      if (editForm.password.trim()) body.password = editForm.password;
      await api.patch(`/users/${editId}`, body);
      setOk('Usuario actualizado');
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const deactivate = async (u) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/users/${u.id}`, {
        activo: false,
        granja_ids: (u.granjas || []).map((g) => g.id),
      });
      setOk(`${u.nombre} desactivado`);
      if (editId === u.id) setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo deactivate');
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

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Usuarios</h1>
      <p style={s.sub}>Alta y edición de cuentas sin superar su propio alcance</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={crear} style={s.card}>
        <div style={s.row}>
          <input
            style={s.input}
            required
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            style={s.input}
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={s.input}
            required
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            style={s.select}
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <p style={{ marginBottom: 8 }}>Granjas asignadas:</p>
        <div style={s.row}>
          {granjas.map((g) => (
            <label key={g.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.granja_ids.includes(g.id)}
                onChange={() => toggleGranja(g.id, 'create')}
              />
              {g.nombre}
            </label>
          ))}
        </div>
        <button type="submit" style={s.btn}>
          Crear usuario
        </button>
      </form>

      {editId && (
        <form onSubmit={guardarEdicion} style={s.card}>
          <h3 style={{ marginTop: 0 }}>Editar usuario #{editId}</h3>
          <div style={s.row}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={editForm.activo}
                onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
              />
              Activo
            </label>
            <input
              style={s.input}
              type="password"
              placeholder="Nueva contraseña (opc.)"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </div>
          <p style={{ marginBottom: 8 }}>Granjas:</p>
          <div style={s.row}>
            {granjas.map((g) => (
              <label key={g.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={editForm.granja_ids.includes(g.id)}
                  onChange={() => toggleGranja(g.id, 'edit')}
                />
                {g.nombre}
              </label>
            ))}
          </div>
          <div style={s.row}>
            <button type="submit" style={s.btn}>
              Guardar cambios
            </button>
            <button type="button" style={s.btnGhost} onClick={() => setEditId(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Nombre</th>
            <th style={s.th}>Email</th>
            <th style={s.th}>Rol</th>
            <th style={s.th}>Activo</th>
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
              <td style={s.td}>{u.activo === false ? 'No' : 'Sí'}</td>
              <td style={s.td}>{(u.granjas || []).map((g) => g.nombre).join(', ') || '—'}</td>
              <td style={s.td}>
                <button type="button" style={{ ...s.btnGhost, marginRight: 6 }} onClick={() => abrirEditar(u)}>
                  Editar
                </button>
                {u.activo !== false && (
                  <button type="button" style={s.btnDanger} onClick={() => deactivate(u)}>
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;
