'use client';

import React, { useState } from 'react';
import { useNavigate } from '@/lib/navigation';
import { page as s, theme } from '@/lib/ui';

const REGISTROS_ITEMS = [
  {
    id: 'animales',
    title: 'Registro de Cuy (General)',
    category: 'Población',
    color: '#7A1216',
    bgBadge: 'rgba(122, 18, 22, 0.1)',
    desc: 'Alta individual de cuyes: Código único, Género (M/H), Raza o línea, Categoría y asignación de Jaula.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    path: '/animales',
    keywords: ['cuy', 'animal', 'codigo', 'genero', 'raza', 'categoria', 'jaula', 'alta', 'ingreso'],
  },
  {
    id: 'reproductoras',
    title: 'Hembras Reproductoras',
    category: 'Reproducción',
    color: '#AD1457',
    bgBadge: 'rgba(173, 20, 87, 0.1)',
    desc: 'Fichas individuales de hembras (códigos U01, U102...), historial de partos, camadas y fertilidad.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="5" />
        <path d="M12 13v8" />
        <path d="M9 18h6" />
      </svg>
    ),
    path: '/reproductoras',
    keywords: ['hembras', 'reproductoras', 'madres', 'partos', 'fichas hembras'],
  },
  {
    id: 'reproductores',
    title: 'Machos Reproductores',
    category: 'Reproducción',
    color: '#1565C0',
    bgBadge: 'rgba(21, 101, 192, 0.1)',
    desc: 'Fichas individuales de machos (códigos UM01, UM24...), control de empadres y % de preñez.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="14" r="5" />
        <path d="M19 5l-5.4 5.4" />
        <path d="M19 5h-5" />
        <path d="M19 5v5" />
      </svg>
    ),
    path: '/reproductores',
    keywords: ['machos', 'reproductores', 'padres', 'empadres', 'fichas machos'],
  },
  {
    id: 'movimientos',
    title: 'Traslados y Reubicación',
    category: 'Manejo',
    color: '#00838F',
    bgBadge: 'rgba(0, 131, 143, 0.1)',
    desc: 'Mover animales entre jaulas, por área, o lote completo manteniendo el historial de ubicación.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    path: '/movimientos',
    keywords: ['relocates', 'movimiento', 'cambio jaula', 'reubicacion'],
  },
];

const RegistroHub = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = REGISTROS_ITEMS.filter((item) => {
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
          Animales y ubicación
        </p>
        <h1 style={{ ...s.title, marginBottom: 6 }}>Animales y manejo</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Altas de cuyes, fichas reproductivas y traslados entre jaulas. Áreas e inventario están en Estructura.
        </p>
      </div>

      {/* Buscador de Registro */}
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
              placeholder="¿Qué deseas registrar? (ej: Cuy, Hembra, Macho, Traslado...)"
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
              autoFocus
            />
          </div>
          {query && (
            <button onClick={() => setQuery('')} style={s.btnGhost}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas de Registro */}
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
            onClick={() => navigate(item.path, { state: { from: '/registro' } })}
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
                Abrir Registro
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

export default RegistroHub;
