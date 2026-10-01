'use client';

import React, { useState } from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../context/AuthContext';
import { page as s, theme } from '@/lib/ui';
import { isSuperadmin } from '@/lib/roles';

const CONFIG_ITEMS = [
  {
    id: 'usuarios',
    title: 'Usuarios y Cuentas',
    category: 'Seguridad',
    adminOnly: true,
    color: '#1565C0',
    bgBadge: 'rgba(21, 101, 192, 0.1)',
    desc: 'Crear usuarios, asignar roles (Admin, Encargado, Supervisor) y definir el alcance de granjas asignadas.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    path: '/usuarios',
    keywords: ['usuarios', 'cuentas', 'roles', 'permisos', 'personal', 'operadores', 'granjas asignadas'],
  },
  {
    id: 'catalogos',
    title: 'Catálogo de Razas y Categorías',
    category: 'Zootecnia',
    color: '#7A1216',
    bgBadge: 'rgba(122, 18, 22, 0.1)',
    desc: 'Razas oficiales (Perú, Andina, Mantaro, Inti, Tipos 2-4) y Categorías biológicas (Gazapo, Recría, Reproductor/a).',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    path: '/catalogos',
    keywords: ['catalogos', 'razas', 'lineas', 'categorias', 'especies', 'clasificacion'],
  },
  {
    id: 'alertas-config',
    title: 'Plazos de Alertas y Ciclo Biológico',
    category: 'Alertas',
    color: '#D84315',
    bgBadge: 'rgba(216, 67, 21, 0.1)',
    desc: 'Configuración de días de gestación (~67 días), días al destete (~14-21 días) y reglas de avisos automáticos.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    path: '/alertas/plazos',
    keywords: ['plazos', 'dias destete', 'dias gestacion', 'alertas', 'ciclo biologico', 'tiempos'],
  },
  {
    id: 'auditoria',
    title: 'Registro de Auditoría',
    category: 'Seguridad',
    adminOnly: true,
    color: '#455A64',
    bgBadge: 'rgba(69, 90, 100, 0.1)',
    desc: 'Historial inmutable de cambios, qué usuario registró, modificó o anuló datos con fecha y hora.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    path: '/auditoria',
    keywords: ['auditoria', 'logs', 'historial', 'trazabilidad', 'quien modifico', 'seguridad'],
  },
];

const ConfiguracionHub = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin';
  const superadmin = isSuperadmin(user?.rol);

  const visibleItems = CONFIG_ITEMS.filter((item) => {
    if (superadmin) return item.id === 'usuarios';
    return !item.adminOnly || admin;
  });

  const filtered = visibleItems.filter((item) => {
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
        <h1 style={{ ...s.title, marginBottom: 6 }}>Configuración General</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Gestión de usuarios, roles, catálogos de razas y categorías, plazos del ciclo biológico y auditoría institucional.
        </p>
      </div>

      {/* Buscador de Configuración */}
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
              placeholder="Buscar en configuración (usuarios, roles, razas, alertas, auditoría...)"
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

      {/* Tarjetas de Configuración */}
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
            onClick={() => navigate(item.path, { state: { from: '/configuracion' } })}
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
                Abrir Configuración
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

export default ConfiguracionHub;
