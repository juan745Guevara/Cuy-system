'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';

type Alerta = {
  key: string;
  tipo: string;
  id_animal?: any;
  id_referencia?: any;
  codigo?: string;
  jaula?: string;
  fecha_prevista?: string;
  vencida?: boolean;
  ruta?: string;
  mensaje?: string;
  estado?: 'pendiente' | 'en_proceso' | 'resuelto' | 'descartado';
  motivo_descarte?: string;
};

const ESTADOS = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'resuelto', label: 'Resuelto' },
  { key: 'descartado', label: 'Descartado' },
] as const;

const Alertas = () => {
  const { user } = useAuth();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin' || user?.rol === 'supervisor';
  const [data, setData] = useState<{ pendientes: any[]; vencidas: any[]; proximas: any[] }>({ pendientes: [], vencidas: [], proximas: [] });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/cuyes/alerts');
      setData(data);
      const todas: Alerta[] = [
        ...(data.pendientes || []),
        ...(data.vencidas || []),
        ...(data.proximas || []),
      ].map((a: any) => ({
        ...a,
        estado: a.estado || 'pendiente',
      }));
      setAlertas(todas);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar alertas');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const discard = async (alerta: Alerta) => {
    const motivo = window.prompt('Motivo del descarte') || '';
    try {
      await api.post('/cuyes/alerts/discard', {
        tipo: alerta.tipo,
        id_animal: alerta.id_animal,
        id_referencia: alerta.id_referencia,
        motivo,
      });
      setAlertas((prev) =>
        prev.map((a) =>
          a.key === alerta.key ? { ...a, estado: 'descartado', motivo_descarte: motivo } : a,
        ),
      );
      setOk('Alerta descartada');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo descartar');
    }
  };

  const marcarEnProceso = (alerta: Alerta) => {
    setAlertas((prev) => prev.map((a) => (a.key === alerta.key ? { ...a, estado: 'en_proceso' } : a)));
  };

  const resolver = (alerta: Alerta) => {
    setAlertas((prev) => prev.map((a) => (a.key === alerta.key ? { ...a, estado: 'resuelto' } : a)));
  };

  const tiposUnicos = Array.from(new Set(alertas.map((a) => a.tipo).filter(Boolean)));

  const getAlertasPorEstado = (estado: string) => {
    return alertas.filter((a) => {
      const matchEstado = !filtroEstado || a.estado === estado;
      const matchTipo = !filtroTipo || a.tipo === filtroTipo;
      return a.estado === estado && matchTipo;
    });
  };

  const kanbanColStyle: React.CSSProperties = {
    background: theme.creamSoft,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    padding: '0.75rem',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    padding: '0.75rem',
    boxShadow: theme.shadowSoft,
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Alertas</h1>
      <p style={s.sub}>
        Kanban por estado de alertas.{' '}
        {admin && <Link to="/alertas/plazos">Configurar plazos</Link>}
      </p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={{ ...s.card, display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
        <select style={s.select} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
        <select style={s.select} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tiposUnicos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {ESTADOS.map((estado) => (
          <div key={estado.key}>
            <h3 style={{ margin: '0 0 0.5rem', color: theme.maroonDeep }}>
              {estado.label} ({getAlertasPorEstado(estado.key).length})
            </h3>
            <div style={kanbanColStyle}>
              {getAlertasPorEstado(estado.key).length === 0 ? (
                <p style={{ color: theme.muted, textAlign: 'center' }}>Sin alertas</p>
              ) : (
                getAlertasPorEstado(estado.key).map((a) => (
                  <div key={a.key} style={cardStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{a.mensaje || a.codigo || a.tipo}</div>
                    <div style={{ fontSize: '0.9rem', color: theme.muted, marginBottom: '0.5rem' }}>
                      {a.fecha_prevista && <span>Fecha: {a.fecha_prevista}</span>}
                      {a.jaula && <span> · Jaula: {a.jaula}</span>}
                      {a.vencida && <span style={{ color: theme.danger }}> · Vencida</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {a.ruta && <Link to={a.ruta}>Ir</Link>}
                      {estado.key === 'pendiente' && (
                        <button type="button" style={s.btnGhost} onClick={() => marcarEnProceso(a)}>
                          Marcar en proceso
                        </button>
                      )}
                      {(estado.key === 'pendiente' || estado.key === 'en_proceso') && (
                        <button type="button" style={s.btn} onClick={() => resolver(a)}>
                          Resolver
                        </button>
                      )}
                      {estado.key !== 'descartado' && (
                        <button type="button" style={s.btnDanger} onClick={() => discard(a)}>
                          Descartar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alertas;
