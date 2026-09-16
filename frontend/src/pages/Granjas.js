import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** Administrar granjas · asignar usuarios */
const Granjas = () => {
  const { user } = useAuth();
  const [granjas, setGranjas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    id_especie: '',
    ubicacion: '',
    responsable: '',
    fecha_inicio: '',
  });
  const [asignacion, setAsignacion] = useState({ id_granja: '', usuario_ids: [] });

  const esSuper = user?.rol === 'superadmin';
  const puedeAsignar = user?.rol === 'superadmin' || user?.rol === 'admin';

  const load = useCallback(async () => {
    try {
      const g = await api.get('/granjas');
      setGranjas(g.data);
      if (esSuper) {
        const e = await api.get('/catalogos/especies');
        setEspecies(e.data);
      }
      if (puedeAsignar) {
        const u = await api.get('/usuarios');
        setUsuarios(u.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar granjas');
    }
  }, [esSuper, puedeAsignar]);

  useEffect(() => {
    load();
  }, [load]);

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/granjas', {
        ...form,
        id_especie: Number(form.id_especie),
      });
      setOk('Granja creada');
      setForm({ nombre: '', id_especie: '', ubicacion: '', responsable: '', fecha_inicio: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    }
  };

  const desactivar = async (id) => {
    try {
      await api.patch(`/granjas/${id}/desactivar`);
      setOk('Granja desactivada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo desactivar');
    }
  };

  const asignar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.put(`/granjas/${asignacion.id_granja}/usuarios`, {
        usuario_ids: asignacion.usuario_ids,
      });
      setOk('Usuarios asignados a la granja');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo asignar');
    }
  };

  const toggleUser = (id) => {
    setAsignacion((a) => ({
      ...a,
      usuario_ids: a.usuario_ids.includes(id)
        ? a.usuario_ids.filter((x) => x !== id)
        : [...a.usuario_ids, id],
    }));
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Granjas</h1>
      <p style={s.sub}>Administración institucional y alcance de usuarios</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Nombre</th>
            <th style={s.th}>Especie</th>
            <th style={s.th}>Ubicación</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {granjas.map((g) => (
            <tr key={g.id}>
              <td style={s.td}>{g.nombre}</td>
              <td style={s.td}>{g.especie}</td>
              <td style={s.td}>{g.ubicacion || '—'}</td>
              <td style={s.td}>
                {esSuper && (
                  <button type="button" style={s.btnDanger} onClick={() => desactivar(g.id)}>
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {esSuper && (
        <form onSubmit={crear} style={{ ...s.card, marginTop: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Nueva granja</h3>
          <div style={s.row}>
            <input
              style={s.input}
              required
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <select
              style={s.select}
              required
              value={form.id_especie}
              onChange={(e) => setForm({ ...form, id_especie: e.target.value })}
            >
              <option value="">Especie</option>
              {especies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <input
              style={s.input}
              placeholder="Ubicación"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />
            <input
              style={s.input}
              placeholder="Responsable"
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            />
            <input
              style={s.input}
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
            <button type="submit" style={s.btn}>
              Crear
            </button>
          </div>
        </form>
      )}

      {puedeAsignar && (
        <form onSubmit={asignar} style={s.card}>
          <h3 style={{ marginTop: 0 }}>Asignar usuarios a granja</h3>
          <select
            style={s.select}
            required
            value={asignacion.id_granja}
            onChange={(e) => setAsignacion({ ...asignacion, id_granja: e.target.value })}
          >
            <option value="">Granja</option>
            {granjas.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <div style={{ ...s.row, marginTop: 12 }}>
            {usuarios.map((u) => (
              <label key={u.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={asignacion.usuario_ids.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                {u.nombre} ({u.rol})
              </label>
            ))}
          </div>
          <button type="submit" style={{ ...s.btn, marginTop: 12 }}>
            Guardar asignación
          </button>
        </form>
      )}
    </div>
  );
};

export default Granjas;
