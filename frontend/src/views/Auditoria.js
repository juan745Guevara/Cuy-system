'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** Trazabilidad / anulación */
const Auditoria = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [entidad, setEntidad] = useState('');
  const [anular, setAnular] = useState({ tipo: 'mortalidad', id: '', motivo: '' });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/audit', {
        params: entidad ? { entidad } : undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar auditoría');
    }
  }, [entidad]);

  useEffect(() => {
    load();
  }, [load]);

  const enviarAnular = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post(`/audit/void/${anular.tipo}/${anular.id}`, {
        motivo: anular.motivo,
      });
      setOk(`Registro ${anular.tipo} #${anular.id} anulado`);
      setAnular({ ...anular, id: '', motivo: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo anular');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Auditoría</h1>
      <p style={s.sub}>Historial de cambios y anulaciones</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={enviarAnular} style={{ ...s.card, ...s.row }}>
        <select
          style={s.select}
          value={anular.tipo}
          onChange={(e) => setAnular({ ...anular, tipo: e.target.value })}
        >
          <option value="mortalidad">Mortalidad</option>
          <option value="venta">Venta</option>
        </select>
        <input
          style={s.input}
          required
          placeholder="ID registro"
          value={anular.id}
          onChange={(e) => setAnular({ ...anular, id: e.target.value })}
        />
        <input
          style={{ ...s.input, minWidth: 220 }}
          required
          placeholder="Motivo anulación"
          value={anular.motivo}
          onChange={(e) => setAnular({ ...anular, motivo: e.target.value })}
        />
        <button type="submit" style={s.btn}>
          Anular (soft)
        </button>
      </form>

      <div style={s.row}>
        <select style={s.select} value={entidad} onChange={(e) => setEntidad(e.target.value)}>
          <option value="">Todas las entidades</option>
          <option value="mortalidad">mortalidad</option>
          <option value="venta">venta</option>
          <option value="login">login</option>
        </select>
        <button type="button" style={s.btnGhost} onClick={load}>
          Actualizar
        </button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Fecha</th>
            <th style={s.th}>Usuario</th>
            <th style={s.th}>Acción</th>
            <th style={s.th}>Entidad</th>
            <th style={s.th}>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={s.td}>{String(r.created_at).slice(0, 19).replace('T', ' ')}</td>
              <td style={s.td}>{r.usuario_nombre || r.id_usuario || '—'}</td>
              <td style={s.td}>{r.accion}</td>
              <td style={s.td}>
                {r.entidad || '—'}
                {r.id_entidad ? ` #${r.id_entidad}` : ''}
              </td>
              <td style={s.td}>{r.detalle || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Auditoria;
