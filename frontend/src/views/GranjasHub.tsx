'use client';

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@/lib/navigation';
import api from '@/lib/api';
import { useAuth } from '../context/AuthContext';
import { page as s, theme } from '@/lib/ui';

const GranjasHub = () => {
  const { granjas, granjaActiva } = useAuth();
  const [ocupacion, setOcupacion] = useState(null);
  const navigate = useNavigate();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);

  useEffect(() => {
    api
      .get('/recintos/occupancy')
      .then((o) => setOcupacion(o.data))
      .catch(() => setOcupacion(null));
  }, []);

  const items = [
    {
      id: 'areas',
      title: 'Áreas',
      color: '#2E7D32',
      bgBadge: 'rgba(46, 125, 50, 0.1)',
      desc: 'Agrupa jaulas por zona o propósito.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      path: '/areas',
    },
    {
      id: 'jaulas',
      title: 'Jaulas',
      color: '#E65100',
      bgBadge: 'rgba(230, 81, 0, 0.1)',
      desc: 'Códigos, capacidad y animales por jaula.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      path: '/jaulas',
    },
    {
      id: 'inventario',
      title: 'Inventario',
      color: '#7A1216',
      bgBadge: 'rgba(122, 18, 22, 0.1)',
      desc: 'Población por raza, categoría y área.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      path: '/inventario',
    },
  ];

  return (
    <div style={s.wrap}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ ...s.title, marginBottom: 6 }}>Estructura e inventario</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Áreas, jaulas y censo de la granja activa: {granja?.nombre} ({granja?.especie}). El panel general está en Inicio → Panel.
        </p>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => navigate(item.path, { state: { from: '/granjas-panel' } })}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.9rem',
              width: '100%',
              textAlign: 'left',
              background: theme.creamSoft,
              border: `1.5px solid ${theme.border}`,
              borderRadius: theme.radiusLg,
              padding: '1.4rem 1.4rem 1.2rem',
              cursor: 'pointer',
              boxShadow: theme.shadowSoft,
              transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
              fontFamily: theme.fontBody,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(79, 12, 16, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadowSoft;
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.radius,
                background: item.bgBadge,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </span>
            <span style={{ display: 'block', width: '100%' }}>
              <span
                style={{
                  display: 'block',
                  color: theme.maroonDeep,
                  fontSize: '1.25rem',
                  fontFamily: theme.fontDisplay,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {item.title}
              </span>
              <span style={{ display: 'block', color: theme.muted, fontSize: '0.9rem', lineHeight: 1.45 }}>
                {item.desc}
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 'auto',
                color: item.color,
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              Abrir
              <svg
                aria-hidden
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GranjasHub;
