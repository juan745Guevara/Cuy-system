'use client';

import React, { useEffect, useState, useMemo, type CSSProperties } from 'react';
import { Link, useNavigate } from '@/lib/navigation';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';

/** Estilos locales del Dashboard Operativo 2.0 (mockup UNAS v2.0) */
const gridKpi = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))',
  gap: '1.1rem',
  marginBottom: '1.6rem',
};

const kpiCard: CSSProperties = {
  padding: '1.25rem 1.3rem',
  background: `linear-gradient(145deg, ${theme.creamSoft} 0%, #FAF3E8 100%)`,
  border: `1.5px solid ${theme.border}`,
  borderRadius: theme.radiusLg,
  boxShadow: theme.shadowSoft,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
};

const kpiLabel = {
  fontSize: '0.72rem',
  fontWeight: 750,
  color: theme.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.35rem',
};

const kpiValue = {
  fontSize: '2.2rem',
  fontFamily: theme.fontDisplay,
  fontWeight: 700,
  color: theme.maroonDeep,
  lineHeight: 1,
  margin: '0.15rem 0 0.45rem',
};

const kpiFooter = { fontSize: '0.79rem', color: theme.muted };

/** Tarjeta KPI Hero del mockup */
function HeroKpi({ label, badge, badgeColor, badgeBg, value, valueColor, footer, accent = theme.maroon }) {
  return (
    <div style={kpiCard}>
      <div
        style={{
          position: 'absolute',
          top: -14,
          right: -14,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `${accent}0D`,
        }}
      />
      <div>
        <div style={kpiLabel}>
          <span>{label}</span>
          {badge && (
            <span
              style={{
                padding: '0.14rem 0.5rem',
                background: badgeBg || 'rgba(155,28,31,0.1)',
                color: badgeColor || theme.danger,
                borderRadius: 12,
                fontSize: '0.68rem',
                fontWeight: 750,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div style={{ ...kpiValue, color: valueColor || theme.maroonDeep }}>{value}</div>
      </div>
      <div style={kpiFooter}>{footer}</div>
    </div>
  );
}

/** Paso del Pipeline Biológico */
function BioStep({ n, name, time, count, route, navigate, active }) {
  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      title={`Ir a ${name}`}
      style={{
        flex: 1,
        minWidth: 128,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: theme.fontBody,
        textAlign: 'center',
        padding: '0.85rem 0.5rem',
        borderTop: `3px solid ${active ? theme.maroon : theme.border}`,
        borderRadius: '10px 10px 0 0',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(122,18,22,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          margin: '0 auto 0.4rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.82rem',
          color: active ? '#FFF' : theme.maroon,
          background: active ? theme.maroon : theme.creamDeep,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: '0.82rem', fontWeight: 750, color: theme.ink, lineHeight: 1.15 }}>{name}</div>
      <div style={{ fontSize: '0.68rem', color: theme.muted, marginTop: '0.15rem' }}>{time}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.maroon, marginTop: '0.25rem' }}>{count}</div>
    </button>
  );
}

/** Celda del Mapa de Jaulas (Nursery Heatmap) */
function CageCell({ cage, onOpen }) {
  const pct =
    cage.capacidad_maxima > 0 ? Math.round((cage.ocupacion / cage.capacidad_maxima) * 100) : cage.ocupacion > 0 ? 100 : 0;
  const status = cage.ocupacion === 0 ? 'empty' : pct > 100 ? 'danger' : pct >= 80 ? 'warn' : 'ok';
  const borderColor =
    status === 'danger' ? theme.danger : status === 'warn' ? '#B45309' : status === 'ok' ? '#15803D' : theme.border;
  const bg = status === 'danger' ? '#FFF5F5' : status === 'warn' ? '#FFFDF5' : status === 'empty' ? '#FAFAF6' : '#FFFFFF';

  return (
    <button
      type="button"
      onClick={() => onOpen({ ...cage, _pct: pct, _status: status })}
      title={`${cage.codigo} — ${cage.areaNombre}`}
      style={{
        border: `1.5px solid ${theme.border}`,
        borderTop: `4px solid ${borderColor}`,
        background: bg,
        borderRadius: theme.radiusSm,
        padding: '0.6rem 0.7rem',
        cursor: 'pointer',
        fontFamily: theme.fontBody,
        textAlign: 'left',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadowSoft;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: theme.ink }}>{cage.codigo}</div>
      <div style={{ fontSize: '0.68rem', color: theme.muted }}>{cage.areaNombre}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.73rem',
          fontWeight: 700,
          color: theme.ink,
          marginTop: '0.3rem',
        }}
      >
        <span>{cage.ocupacion} anim.</span>
        <span style={{ color: borderColor, fontWeight: 800 }}>
          {cage.ocupacion === 0 ? 'vacía' : `${pct}%${status === 'danger' ? ' !' : ''}`}
        </span>
      </div>
    </button>
  );
}

/**
 * Dashboard Operativo 2.0 — Telemetría en Tiempo Real y Control Zootécnico
 * Facultad de Zootecnia · Universidad Nacional Agraria de la Selva (UNAS)
 * Rediseño según mockup UX/UI v2.0 (pipeline biológico + heatmap de jaulas).
 */
const Dashboard = () => {
  const { granjaActiva, granjas } = useAuth();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pob, setPob] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [jaulaAbierta, setJaulaAbierta] = useState(null);

  const fetchData = () => {
    setLoading(true);
    const now = new Date();
    Promise.all([
      api.get('/cuyes/inventory/population').catch(() => ({ data: null })),
      api.get('/cuyes/inventory/monthly-summary', {
        params: { anio: now.getFullYear(), mes: now.getMonth() + 1 },
      }).catch(() => ({ data: null })),
      api.get('/cuyes/alerts').catch(() => ({ data: null })),
      api.get('/recintos/occupancy').catch(() => ({ data: null })),
    ])
      .then(([p, r, a, o]) => {
        setPob(p.data);
        setResumen(r.data);
        setAlertas(a.data);
        setOcupacion(o.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [granjaActiva]);

  /* ---------- Métricas derivadas ---------- */
  const totalAnimales = pob?.total ?? 0;
  const nacimientosMes = resumen?.nacimientos ?? 0;
  const nacimientosM = resumen?.nacimientos_m ?? 0;
  const nacimientosH = resumen?.nacimientos_h ?? 0;
  const mortalidadMes = resumen?.mortalidad ?? 0;
  const ventasMes = resumen?.ventas ?? 0;
  const tasaMortalidad =
    totalAnimales > 0 ? ((mortalidadMes / totalAnimales) * 100).toFixed(1) : '0.0';
  const mortalidadOk = Number(tasaMortalidad) <= 3.0;

  const alertasVencidas = alertas?.vencidas || [];
  const alertasProximas = alertas?.proximas || [];
  const totalAlertas = alertasVencidas.length + alertasProximas.length;
  const partosProyectados = alertasProximas.filter((a) => a.tipo === 'parto_proximo').length;
  const destetesPendientes = alertasProximas.filter((a) => a.tipo === 'destete_pendiente').length;
  const empadresDisponibles = alertasProximas.filter((a) => a.tipo === 'empadre_disponible').length;

  const ocupacionGranja = ocupacion?.granja?.ocupacion ?? 0;
  const capacidadGranja = ocupacion?.granja?.capacidad ?? 0;
  const pctOcupacionGlobal =
    capacidadGranja > 0 ? Math.min(100, Math.round((ocupacionGranja / capacidadGranja) * 100)) : 0;
  const sobrecupo = ocupacion?.sobrecupo || [];

  // Liquidación de población por categorías para el pipeline
  const repos = useMemo(() => {
    const cats = pob?.por_categoria || [];
    const byCat = (kw, sexo) =>
      cats
        .filter(
          (c) =>
            String(c.categoria || '')
              .toLowerCase()
              .includes(kw) && (!sexo || c.sexo === sexo)
        )
        .reduce((s, c) => s + Number(c.cantidad || 0), 0);
    return {
      hembrasRepro: byCat('reproductora', 'H'),
      machosRepro: byCat('reproductor', 'M'),
      recria: byCat('recr', null),
      engorde: byCat('engorde', null) + byCat('descarte', null),
    };
  }, [pob]);

  /* Jaulas del Mapa Espacial (Nursery Heatmap) */
  const cages = useMemo(() => {
    const areas = ocupacion?.areas || [];
    const list = [];
    areas.forEach((area) =>
      (area.jaulas || []).forEach((j) =>
        list.push({
          id: j.id,
          codigo: j.codigo,
          capacidad_maxima: j.capacidad_maxima || 0,
          ocupacion: j.ocupacion || 0,
          areaNombre: area.nombre,
          proposito: area.proposito || '—',
        })
      )
    );
    return list;
  }, [ocupacion]);

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pipeline = [
    { n: 1, name: 'Empadre / Monta', time: 'Día 0 - 30', count: `${repos.hembrasRepro} Hembras`, route: '/empadres', active: true },
    { n: 2, name: 'Gestación', time: '68 días prom.', count: `${partosProyectados} Partos prox.`, route: '/alertas', active: true },
    { n: 3, name: 'Parto & Lactancia', time: 'Día 0 - 14', count: `${nacimientosMes} Nacimientos`, route: '/births', active: true },
    { n: 4, name: 'Destete', time: 'Día 14 - 21', count: `${destetesPendientes} Camadas`, route: '/weanings', active: true },
    { n: 5, name: 'Recría & Engorde', time: 'Día 21 - 90', count: `${repos.recria + repos.engorde} Gazapos`, route: '/animales', active: true },
    { n: 6, name: 'Selección / Venta', time: '> 90 días', count: `${ventasMes} Salidas mes`, route: '/ventas', active: false },
  ];

  const statusJaula = {
    danger: { label: 'Sobrecupo (>100%)', color: theme.danger, bg: '#FBE9E9' },
    warn: { label: 'Capacidad límite (80-100%)', color: '#B45309', bg: '#FEF3C7' },
    ok: { label: 'Óptimo (<80%)', color: '#15803D', bg: '#DCFCE7' },
    empty: { label: 'Vacía', color: theme.muted, bg: '#EFEAE0' },
  };

  return (
    <div style={s.wrap}>
      {/* ==================== 1. ENCABEZADO PRINCIPAL ==================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.25rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          paddingBottom: '1.25rem',
          borderBottom: `1.5px solid ${theme.border}`,
        }}
      >
        <div>
          <h1 style={{ ...s.title, margin: '0 0 0.35rem', fontSize: '2.1rem', lineHeight: 1.15 }}>
            Estado Productivo &amp; Telemetría del Criadero
          </h1>

          <p style={{ ...s.sub, margin: 0, fontSize: '0.95rem' }}>
            {granja ? (
              <span>
                <strong style={{ color: theme.maroonDeep }}>{granja.especie}</strong> · {granja.nombre}
              </span>
            ) : (
              'Granja Activa'
            )}{' '}
            — <span style={{ textTransform: 'capitalize' }}>{fechaHoy}</span>
            <span style={{ color: theme.muted }}>
              {' '}
              · Monitoreo de población, ocupación de jaulas y alertas zootécnicas UNAS.
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={fetchData} title="Actualizar datos en tiempo real" style={{ ...s.btnGhost, padding: '0.6rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Actualizando...' : 'Refrescar'}</span>
          </button>

          <Link to="/registro" style={{ ...s.btn, padding: '0.62rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Nuevo Registro Rápido</span>
          </Link>

          <Link to="/empadres" style={{ ...s.btnGhost, padding: '0.62rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>+ Nuevo Empadre</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ ...s.card, textAlign: 'center', color: theme.muted, padding: '3rem 1rem' }}>
          Cargando telemetría del criadero…
        </div>
      ) : (
        <>
          {/* ==================== 2. TARJETAS HERO KPI ==================== */}
          <div style={gridKpi}>
            <HeroKpi
              label="Población Total"
              badge="Plantel UNAS"
              badgeBg="rgba(46,125,50,0.12)"
              badgeColor="#2E7D32"
              value={totalAnimales.toLocaleString()}
              valueColor={theme.maroonDeep}
              footer={`${repos.hembrasRepro + repos.machosRepro} Reproductores · ${repos.recria + repos.engorde} Recría/Engorde`}
            />
            <HeroKpi
              label="Nacimientos (Mes)"
              badge="Partos"
              badgeBg="rgba(156,39,176,0.1)"
              badgeColor="#7B1FA2"
              value={`+${nacimientosMes.toLocaleString()}`}
              valueColor="#7B1FA2"
              footer={`♂ ${nacimientosM} · ♀ ${nacimientosH}`}
            />
            <HeroKpi
              label="Tasa de Mortalidad"
              badge={`${tasaMortalidad}% tasa`}
              badgeBg={mortalidadOk ? 'rgba(46,125,50,0.1)' : 'rgba(198,40,40,0.1)'}
              badgeColor={mortalidadOk ? '#2E7D32' : '#C62828'}
              value={`${tasaMortalidad}%`}
              valueColor={mortalidadOk ? theme.maroonDeep : theme.danger}
              footer="Objetivo zootécnico: < 3.0%"
            />
            <HeroKpi
              label="Alertas Reproductivas"
              badge={`${alertasVencidas.length} Vencidas`}
              badgeBg="rgba(198,40,40,0.1)"
              badgeColor={theme.danger}
              value={totalAlertas}
              valueColor={theme.danger}
              footer={
                partosProyectados > 0
                  ? `${partosProyectados} partos proyectados próximos`
                  : `+ ${empadresDisponibles} hembras listas para empadre`
              }
              accent={theme.danger}
            />
          </div>

          {/* ==================== 3. PIPELINE BIOLÓGICO ==================== */}
          <div style={{ ...s.card, background: theme.creamSoft }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={theme.maroon} strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong style={{ fontFamily: theme.fontDisplay, fontSize: '1.05rem', color: theme.maroonDeep }}>
                  Pipeline Biológico del Cuy — Población por Fase
                </strong>
              </div>
              <span style={{ fontSize: '0.78rem', color: theme.muted }}>Ciclo total estándar: ~135 días</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                borderTop: 'none',
                overflowX: 'auto',
                paddingTop: '0.5rem',
              }}
            >
              {pipeline.map((p) => (
                <BioStep key={p.n} {...p} navigate={navigate} active={p.active} />
              ))}
            </div>
          </div>

          {/* ==================== 4. MAPA ESPACIAL DE OCUPACIÓN (NURSERY HEATMAP) ==================== */}
          <div style={{ ...s.card, background: theme.creamSoft, marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3 style={{ fontFamily: theme.fontDisplay, fontSize: '1.12rem', fontWeight: 700, color: theme.maroonDeep, margin: 0 }}>
                  Mapa Espacial de Ocupación por Jaulas
                </h3>
                <p style={{ fontSize: '0.8rem', color: theme.muted, margin: '0.25rem 0 0' }}>
                  Ocupación en tiempo real · {granja?.nombre || 'Granja activa'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.74rem', color: theme.muted }}>
                {['ok', 'warn', 'danger'].map((k) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: statusJaula[k].color }} />
                    {statusJaula[k].label}
                  </span>
                ))}
              </div>
            </div>

            {cages.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: theme.muted, textAlign: 'center', padding: '1.5rem 0' }}>
                Sin jaulas registradas para esta granja.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {cages.map((c) => (
                  <CageCell key={c.id} cage={c} onOpen={setJaulaAbierta} />
                ))}
              </div>
            )}
          </div>

          {/* ==================== 5. RESUMEN CONTABLE & OCUPACIÓN GLOBAL ==================== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ ...s.card }}>
              <h3 style={{ fontFamily: theme.fontDisplay, fontSize: '1.05rem', fontWeight: 700, color: theme.maroonDeep, margin: '0 0 0.9rem' }}>
                Resumen Contable Mensual
              </h3>
              {[
                ['Población inicial', resumen?.poblacion_inicial ?? 0],
                ['+ Nacimientos', resumen?.nacimientos ?? 0],
                ['− Mortalidad', resumen?.mortalidad ?? 0],
                ['− Ventas', resumen?.ventas ?? 0],
                ['+ Transferencias in', resumen?.transfers_in ?? 0],
                ['− Transferencias out', resumen?.transfers_out ?? 0],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.83rem',
                    padding: '0.32rem 0',
                    borderBottom: '1px dashed ' + theme.border,
                    color: theme.ink,
                  }}
                >
                  <span>{label}</span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(val).toLocaleString()}</strong>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.6rem',
                  fontSize: '0.95rem',
                }}
              >
                <span style={{ fontWeight: 700, color: theme.maroonDeep }}>Población final</span>
                <strong style={{ fontFamily: theme.fontDisplay, fontSize: '1.25rem', color: theme.maroonDeep }}>
                  {(resumen?.poblacion_final ?? 0).toLocaleString()}
                </strong>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.28rem 0.7rem',
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 750,
                    background: resumen?.continuidad_ok ? 'rgba(46,125,50,0.12)' : 'rgba(198,40,40,0.1)',
                    color: resumen?.continuidad_ok ? '#2E7D32' : '#C62828',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                  {resumen?.continuidad_ok === undefined ? 'Sin validación de continuidad' : resumen.continuidad_ok ? 'Continuidad poblacional verificada' : 'Diferencia en la continuidad'}
                </span>
              </div>
            </div>

            <div style={{ ...s.card }}>
              <h3 style={{ fontFamily: theme.fontDisplay, fontSize: '1.05rem', fontWeight: 700, color: theme.maroonDeep, margin: '0 0 0.9rem' }}>
                Ocupación Global de Jaulas
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: theme.muted }}>Granja ({granja?.nombre || 'Sin nombre'})</span>
                <strong style={{ fontSize: '0.95rem', color: theme.ink }}>
                  {ocupacionGranja} / {capacidadGranja || '—'} cupos · {pctOcupacionGlobal}%
                </strong>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 99,
                  background: theme.creamDeep,
                  overflow: 'hidden',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pctOcupacionGlobal}%`,
                    borderRadius: 99,
                    background: pctOcupacionGlobal >= 100 ? theme.danger : pctOcupacionGlobal >= 80 ? '#B45309' : '#15803D',
                  }}
                />
              </div>

              {sobrecupo.length > 0 ? (
                <div
                  style={{
                    background: '#FBE9E9',
                    border: '1px solid rgba(155,28,31,0.18)',
                    borderRadius: theme.radiusSm,
                    padding: '0.7rem 0.9rem',
                    fontSize: '0.8rem',
                    color: theme.danger,
                  }}
                >
                  <strong>🚨 Jaulas sobre capacidad:</strong>{' '}
                  {sobrecupo.map((s) => `${s.area} · ${s.codigo} (${s.ocupacion}/${s.capacidad_maxima})`).join('  ·  ')}
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(46,125,50,0.08)',
                    border: '1px solid rgba(46,125,50,0.15)',
                    borderRadius: theme.radiusSm,
                    padding: '0.7rem 0.9rem',
                    fontSize: '0.8rem',
                    color: '#2E7D32',
                  }}
                >
                  <strong>✓ Capacidad dentro de parámetros.</strong>
                </div>
              )}

              {empadresDisponibles > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.83rem', color: theme.muted }}>
                  <strong style={{ color: theme.maroon }}>{empadresDisponibles}</strong> hembras listas para nuevo
                  empadre.{' '}
                  <Link to="/empadres" style={{ color: theme.maroon, fontWeight: 700 }}>
                    Iniciar wizard →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================== MODAL: DETALLE DE JAULA (HEATMAP) ==================== */}
      {jaulaAbierta && (
        <div
          onClick={() => setJaulaAbierta(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 20, 18, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            fontFamily: theme.fontBody,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.creamSoft,
              borderRadius: theme.radiusLg,
              boxShadow: theme.shadow,
              width: '100%',
              maxWidth: 460,
              padding: '1.4rem 1.5rem',
              color: theme.ink,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="jaulaModalTitle"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 id="jaulaModalTitle" style={{ fontFamily: theme.fontDisplay, fontSize: '1.2rem', fontWeight: 700, color: theme.maroonDeep, margin: 0 }}>
                Jaula {jaulaAbierta.codigo}
              </h3>
              <button
                onClick={() => setJaulaAbierta(null)}
                aria-label="Cerrar"
                style={{ border: '1px solid ' + theme.border, background: theme.creamSoft, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: theme.muted, fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginBottom: '1.1rem',
              }}
            >
              <div
                style={{
                  flex: 1,
                  borderRadius: theme.radiusSm,
                  padding: '1rem',
                  background: statusJaula[jaulaAbierta._status].bg,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 750, color: statusJaula[jaulaAbierta._status].color }}>
                  {statusJaula[jaulaAbierta._status].label}
                </div>
                <div style={{ fontFamily: theme.fontDisplay, fontSize: '1.8rem', fontWeight: 700, color: statusJaula[jaulaAbierta._status].color, lineHeight: 1.1 }}>
                  {jaulaAbierta._pct}%
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: theme.muted }}>Área</span>
                  <strong>{jaulaAbierta.areaNombre}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: theme.muted }}>Propósito</span>
                  <strong>{jaulaAbierta.proposito}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: theme.muted }}>Ocupación</span>
                  <strong>
                    {jaulaAbierta.ocupacion} / {jaulaAbierta.capacidad_maxima}
                  </strong>
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                color: theme.ink,
                background: theme.cream,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
                padding: '0.85rem 1rem',
                marginBottom: '1.15rem',
              }}
            >
              <strong>Nota operativa:</strong>{' '}
              {jaulaAbierta._status === 'danger'
                ? `SOBRECUPO detectado. Reubicar ${jaulaAbierta.ocupacion - jaulaAbierta.capacidad_maxima} animales antes del próximo pesaje.`
                : jaulaAbierta._status === 'warn'
                ? 'Tope de capacidad cercano. Evaluar reubicación al llegar a 100%.'
                : jaulaAbierta.ocupacion === 0
                ? 'Jaula vacía y disponible para asignación.'
                : 'Ocupación dentro de parámetros zootécnicos UNAS.'}
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/movimientos')}
                style={{ ...s.btn, flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
              >
                Registrar relocate
              </button>
              <button
                type="button"
                onClick={() => navigate('/pesajes')}
                style={{ ...s.btnGhost, flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
              >
                Pesaje de control
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;