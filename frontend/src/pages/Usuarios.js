import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** NUC-06/07/08 — gestión de usuarios con alcance por granja */
const Usuarios = () => {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'encargado',
    granja_ids: [],
  });

  const puedeAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const load = useCallback(async () => {
    if (!puedeAdmin) return;
    try {
      const [u, g] = await Promise.all([api.get('/usuarios'), api.get('/granjas')]);
      setLista(u.data);
      setGranjas(g.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar usuarios');
    }
  }, [puedeAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleGranja = (id) => {
    setForm((f) => ({
      ...f,
      granja_ids: f.granja_ids.includes(id)
        ? f.granja_ids.filter((x) => x !== id)
        : [...f.granja_ids, id],
    }));
  };

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/usuarios', {
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
      <p style={s.sub}>Alta de cuentas sin superar su propio alcance</p>
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
                onChange={() => toggleGranja(g.id)}
              />
              {g.nombre}
            </label>
          ))}
        </div>
        <button type="submit" style={s.btn}>
          Crear usuario
        </button>
      </form>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Nombre</th>
            <th style={s.th}>Email</th>
            <th style={s.th}>Rol</th>
            <th style={s.th}>Granjas</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id}>
              <td style={s.td}>{u.nombre}</td>
              <td style={s.td}>{u.email}</td>
              <td style={s.td}>{u.rol}</td>
              <td style={s.td}>{(u.granjas || []).map((g) => g.nombre).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;
