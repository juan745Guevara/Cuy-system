'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';

/** Configuración de plazos del ciclo biológico (admin). */
const AlertasPlazos = () => {
  const { user } = useAuth();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin' || user?.rol === 'supervisor';
  const [config, setConfig] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/cuyes/alerts/config');
      setConfig(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar plazos');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const guardarConfig = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.put('/cuyes/alerts/config', config);
      setConfig(data);
      setOk('Plazos actualizados');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const updateCfg = (i, field, value) => {
    setConfig((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );
  };

  if (!admin) {
    return (
      <div style={s.wrap}>
        <h1 style={s.title}>Plazos de alertas</h1>
        <p style={s.sub}>No tienes permiso para editar esta configuración.</p>
        <Link to="/configuracion" style={s.btnGhost}>
          Volver a configuración
        </Link>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Plazos de alertas</h1>
      <p style={s.sub}>
        Días de gestación, destete y reglas de avisos automáticos.{' '}
        <Link to="/alertas">Ver bandeja de alertas</Link>
      </p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <form onSubmit={guardarConfig} style={s.card}>
        <h3 style={{ marginTop: 0 }}>Tipos de alerta</h3>
        {config.map((c, i) => (
          <div key={c.tipo} style={s.row}>
            <span style={{ minWidth: 160 }}>{c.tipo}</span>
            <input
              style={s.input}
              type="number"
              value={c.dias}
              onChange={(e) => updateCfg(i, 'dias', Number(e.target.value))}
            />
            <label>
              <input
                type="checkbox"
                checked={c.activo !== false}
                onChange={(e) => updateCfg(i, 'activo', e.target.checked)}
              />{' '}
              Activo
            </label>
          </div>
        ))}
        <button type="submit" style={s.btn}>
          Guardar plazos
        </button>
      </form>
    </div>
  );
};

export default AlertasPlazos;
