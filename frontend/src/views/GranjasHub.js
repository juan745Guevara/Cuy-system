'use client';

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@/navigation';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { page as s, theme } from '../styles/ui';

const GranjasHub = () => {
  const { user, granjas, granjaActiva, seleccionarGranja } = useAuth();
  const [query, setQuery] = useState('');
  const [ocupacion, setOcupacion] = useState(null);
  const [pob, setPob] = useState(null);
  const navigate = useNavigate();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin';
  const granja = (granjas || []).find((g) => g.id === granjaActiva);

  useEffect(() => {
    Promise.all([
      api.get('/cuyes/cages/occupancy').catch(() => ({ data: null })),
      api.get('/cuyes/inventory/population').catch(() => ({ data: null })),
    ]).then(([o, p]) => {
      setOcupacion(o.data);
      setPob(p.data);
    });
  }, []);

  const items = [
    {
      id: 'dashboard',
      title: 'Dashboard y Telemetría en Vivo',
      category: 'Monitoreo',
      color: '#7A1216',
      bgBadge: 'rgba(122, 18, 22, 0.1)',
      desc: 'Telemetría en tiempo real, KPIs reproductivos, mapa espacial de jaulas y pipeline biológico.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      path: '/dashboard',
      keywords: ['dashboard', 'telemetria', 'kpi', 'panel', 'resumen', 'jaulas', 'inicio'],
    },
    {
      id: 'areas',
      title: 'Áreas y Distribución',
      category: 'Zonas',
      color: '#2E7D32',
      bgBadge: 'rgba(46, 125, 50, 0.1)',
      desc: 'Gestión de áreas físicas: Empadre, Gestación/Maternidad, Recría, Machos, Engorde y Cuarentena.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      path: '/areas',
      keywords: ['areas', 'zonas', 'distribucion', 'galpon'],
    },
    {
      id: 'jaulas',
      title: 'Jaulas y Códigos',
      category: 'Ubicaciones',
      color: '#E65100',
      bgBadge: 'rgba(230, 81, 0, 0.1)',
      desc: 'Nomenclatura uniforme de jaulas, asignación de áreas y consulta de cuyes por jaula.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      path: '/jaulas',
      keywords: ['jaulas', 'codigos', 'pozas', 'ubicacion'],
    },
    {
      id: 'inventario',
      title: 'Población e Inventario de Granja',
      category: 'Inventario',
      color: '#7A1216',
      bgBadge: 'rgba(122, 18, 22, 0.1)',
      desc: 'Resumen poblacional por raza, categoría, área y desglose de jaulas ocupadas vs vacías.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      path: '/inventario',
      keywords: ['inventario', 'poblacion', 'censo', 'resumen', 'reporte'],
    },
    ...(admin
      ? [
          {
            id: 'admin-granjas',
            title: 'Administración de Granjas',
            category: 'Gestión',
            color: '#1565C0',
            bgBadge: 'rgba(21, 101, 192, 0.1)',
            desc: 'Crear granjas, definir especie, responsables, ubicación geográfica y activar/deactivate unidades.',
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
            path: '/granjas',
            keywords: ['crear granja', 'administrar', 'especie', 'sedes'],
          },
        ]
      : []),
  ];

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <div style={s.wrap}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p
          style={{
            margin: '0 0 0.35rem',
            color: theme.maroon,
            fontSize: '0.78rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Infraestructura y Espacios
        </p>
        <h1 style={{ ...s.title, marginBottom: 6 }}>Granjas, Áreas y Jaulas</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Organización espacial de la granja activa: {granja?.nombre} ({granja?.especie}).
        </p>
      </div>

      {/* Tarjeta de Granja Activa con Selector */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.maroonDeep} 0%, ${theme.maroon} 100%)`,
          color: theme.creamSoft,
          padding: '1.35rem 1.5rem',
          borderRadius: theme.radiusLg,
          boxShadow: theme.shadow,
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Granja Activa Seleccionada
          </span>
          <h2 style={{ margin: 0, fontFamily: theme.fontDisplay, fontSize: '1.5rem', color: '#FFFFFF' }}>
            {granja?.nombre || 'Granja de Cuyes'}
          </h2>
          <p style={{ margin: '4px 0 0', opacity: 0.88, fontSize: '0.88rem' }}>
            Especie: <strong>{granja?.especie || 'Cuyes'}</strong> · Total Población:{' '}
            <strong>{pob?.total ?? '—'} animales</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            seleccionarGranja(null);
            localStorage.removeItem('farmId');
            navigate('/seleccionar-granja');
          }}
          style={{
            background: theme.creamSoft,
            color: theme.maroonDeep,
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: theme.radiusSm,
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          🔄 Cambiar de Granja
        </button>
      </div>

      {/* Buscador de Opciones de Granja */}
      <div
        style={{
          background: theme.creamSoft,
          padding: '1.25rem 1.4rem',
          borderRadius: theme.radiusLg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.muted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar en áreas, jaulas, códigos o gestión de granjas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                ...s.input,
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: '2.6rem',
                fontSize: '0.98rem',
                borderRadius: theme.radiusSm,
                border: `1.5px solid ${query ? theme.maroon : theme.border}`,
                background: '#FFFFFF',
              }}
            />
          </div>
          {query && (
            <button onClick={() => setQuery('')} style={s.btnGhost}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Alerta de sobrecupo de jaulas si hay */}
      {ocupacion?.sobrecupo?.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
            border: '1px solid #EF9A9A',
            borderRadius: theme.radius,
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <strong style={{ color: '#C62828', display: 'block', marginBottom: 4 }}>
            ⚠️ Alerta: Jaulas que superan su capacidad máxima ({ocupacion.sobrecupo.length})
          </strong>
          <div style={{ fontSize: '0.84rem', color: '#B71C1C' }}>
            {ocupacion.sobrecupo.map((j) => (
              <span key={j.id} style={{ display: 'inline-block', marginRight: 12 }}>
                • {j.codigo}: {j.ocupacion}/{j.capacidad_maxima} cuyes
              </span>
            ))}
          </div>
          <Link to="/jaulas" style={{ display: 'inline-block', marginTop: 8, color: '#C62828', fontWeight: 700, fontSize: '0.84rem' }}>
            Gestionar jaulas →
          </Link>
        </div>
      )}

      {/* Grid de Tarjetas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path, { state: { from: '/granjas-panel' } })}
            style={{
              background: theme.creamSoft,
              border: `1.5px solid ${theme.border}`,
              borderRadius: theme.radiusLg,
              padding: '1.35rem 1.4rem',
              cursor: 'pointer',
              boxShadow: theme.shadowSoft,
              transition: 'all 180ms ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(79, 12, 16, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadowSoft;
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: theme.radius,
                    background: item.bgBadge,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.6rem',
                    background: item.bgBadge,
                    color: item.color,
                    borderRadius: 12,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {item.category}
                </span>
              </div>

              <h3
                style={{
                  margin: '0 0 0.45rem',
                  color: theme.maroonDeep,
                  fontSize: '1.2rem',
                  fontFamily: theme.fontDisplay,
                  fontWeight: 700,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  margin: '0 0 1.15rem',
                  color: theme.muted,
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                }}
              >
                {item.desc}
              </p>
            </div>

            <div
              style={{
                borderTop: `1px solid ${theme.border}`,
                paddingTop: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color }}>
                Acceder a {item.title}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: item.bgBadge,
                  color: item.color,
                }}
              >
                →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GranjasHub;
