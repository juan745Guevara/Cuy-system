'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';

/** Tablero de alertas pendientes/vencidas/próximas · discard · configurar plazos */
const Alertas = () => {
  const { user } = useAuth();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin' || user?.rol === 'supervisor';
  const [data, setData] = useState({ pendientes: [], vencidas: [], proximas: [] });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/cuyes/alerts');
      setData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar alertas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const discard = async (alerta) => {
    const motivo = window.prompt('Motivo del descarte') || '';
    try {
      await api.post('/cuyes/alerts/discard', {
        tipo: alerta.tipo,
        id_animal: alerta.id_animal,
        id_referencia: alerta.id_referencia,
        motivo,
      });
      setOk('Alerta descartada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo discard');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Alertas</h1>
      <p style={s.sub}>
        Tareas del ciclo pendientes o vencidas.{' '}
        {admin && (
          <Link to="/alertas/plazos">Configurar plazos del ciclo</Link>
        )}
      </p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>
          Vencidas ({data.vencidas?.length || 0})
        </h3>
        {(data.vencidas || []).length === 0 ? (
          <p>Ninguna</p>
        ) : (
          <ul>
            {data.vencidas.map((a) => (
              <li key={a.key} style={{ marginBottom: '0.5rem' }}>
                <strong>{a.mensaje}</strong> · {a.fecha_prevista} · jaula {a.jaula || '—'}{' '}
                <Link to={a.ruta || '/'}>Ir</Link>{' '}
                <button type="button" style={s.btnDanger} onClick={() => discard(a)}>
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>
          Próximas ({data.proximas?.length || 0})
        </h3>
        {(data.proximas || []).length === 0 ? (
          <p>Ninguna</p>
        ) : (
          <ul>
            {data.proximas.map((a) => (
              <li key={a.key} style={{ marginBottom: '0.5rem' }}>
                {a.mensaje} · {a.fecha_prevista} · jaula {a.jaula || '—'}{' '}
                <Link to={a.ruta || '/'}>Ir</Link>{' '}
                <button type="button" style={s.btnGhost} onClick={() => discard(a)}>
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default Alertas;
