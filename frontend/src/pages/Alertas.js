import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** NUC-33 pendientes · NUC-34 descartar · NUC-35 / CUY-17 config plazos */
const Alertas = () => {
  const { user } = useAuth();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin' || user?.rol === 'supervisor';
  const [data, setData] = useState({ pendientes: [], vencidas: [], proximas: [] });
  const [config, setConfig] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([api.get('/alertas'), api.get('/alertas/config')]);
      setData(a.data);
      setConfig(c.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar alertas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const descartar = async (alerta) => {
    const motivo = window.prompt('Motivo del descarte') || '';
    try {
      await api.post('/alertas/descartar', {
        tipo: alerta.tipo,
        id_animal: alerta.id_animal,
        id_referencia: alerta.id_referencia,
        motivo,
      });
      setOk('Alerta descartada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo descartar');
    }
  };

  const guardarConfig = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.put('/alertas/config', config);
      setConfig(data);
      setOk('Plazos actualizados');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const updateCfg = (i, field, value) => {
    setConfig((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Alertas</h1>
      <p style={s.sub}>Tareas del ciclo pendientes o vencidas</p>
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
                <button type="button" style={s.btnDanger} onClick={() => descartar(a)}>
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
                <button type="button" style={s.btnGhost} onClick={() => descartar(a)}>
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {admin && (
        <form onSubmit={guardarConfig} style={s.card}>
          <h3 style={{ marginTop: 0 }}>Configurar plazos (NUC-35 / CUY-17)</h3>
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
      )}
    </div>
  );
};

export default Alertas;
