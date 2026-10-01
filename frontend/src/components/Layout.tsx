'use client';

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from '@/lib/navigation';
import { useAuth } from '../context/AuthContext';
import { theme } from '@/lib/ui';
import api from '@/lib/api';

const icons = {
  panel: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  eventos: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ventas: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  animales: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  estructura: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  buscar: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  config: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

/** Sidebar agrupado por tareas (IA opción B). */
const navSections = [
  {
    id: 'inicio',
    label: 'Inicio',
    items: [
      {
        to: '/dashboard',
        label: 'Panel',
        icon: icons.panel,
        matchPaths: ['/dashboard'],
      },
    ],
  },
  {
    id: 'operacion',
    label: 'Operación diaria',
    items: [
      {
        to: '/eventos',
        label: 'Eventos',
        icon: icons.eventos,
        badgeKey: 'alertasVencidas',
        matchPaths: [
          '/eventos',
          '/empadres',
          '/partos',
          '/destetes',
          '/mortalidad',
          '/pesajes',
          '/sanidad',
          '/alertas',
          '/ranking',
        ],
      },
      {
        to: '/ventas',
        label: 'Ventas',
        icon: icons.ventas,
        matchPaths: ['/ventas'],
      },
    ],
  },
  {
    id: 'animales',
    label: 'Animales y ubicación',
    items: [
      {
        to: '/registro',
        label: 'Animales y manejo',
        icon: icons.animales,
        matchPaths: ['/registro', '/animales', '/reproductoras', '/reproductores', '/movimientos'],
      },
    ],
  },
  {
    id: 'granja',
    label: 'Granja',
    items: [
      {
        to: '/granjas-panel',
        label: 'Estructura',
        icon: icons.estructura,
        matchPaths: ['/granjas-panel', '/areas', '/jaulas', '/inventario'],
      },
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas',
    items: [
      {
        to: '/buscar',
        label: 'Buscar',
        icon: icons.buscar,
        matchPaths: ['/buscar'],
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      {
        to: '/configuracion',
        label: 'Configuración',
        icon: icons.config,
        matchPaths: ['/configuracion', '/usuarios', '/catalogos', '/auditoria', '/granjas', '/alertas/plazos'],
      },
    ],
  },
];

const mainNavItems = navSections.flatMap((s) => s.items);

const HUB_PATHS = ['/dashboard', '/eventos', '/buscar', '/ventas', '/registro', '/granjas-panel', '/configuracion'];

const SUBPAGE_HUB = {
  '/empadres': '/eventos',
  '/partos': '/eventos',
  '/destetes': '/eventos',
  '/mortalidad': '/eventos',
  '/pesajes': '/eventos',
  '/sanidad': '/eventos',
  '/alertas': '/eventos',
  '/alertas/plazos': '/configuracion',
  '/ranking': '/eventos',
  '/animales': '/registro',
  '/reproductoras': '/registro',
  '/reproductores': '/registro',
  '/movimientos': '/registro',
  '/areas': '/granjas-panel',
  '/jaulas': '/granjas-panel',
  '/inventario': '/granjas-panel',
  '/usuarios': '/configuracion',
  '/catalogos': '/configuracion',
  '/auditoria': '/configuracion',
  '/granjas': '/configuracion',
};

const initiales = (nombre) =>
  (nombre || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

const Layout = ({ children }) => {
  const { user, granjas, granjaActiva, seleccionarGranja, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');
  const [navBadges, setNavBadges] = useState({ alertasVencidas: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 960) setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (!granjaActiva) return;
    api
      .get('/cuyes/alerts')
      .then((res) => {
        setNavBadges({
          alertasVencidas: res.data?.vencidas?.length || 0,
        });
      })
      .catch(() => setNavBadges({ alertasVencidas: 0 }));
  }, [granjaActiva]);

  const rail = collapsed;
  const showLabel = !rail;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isItemActive = (item) => {
    const current = location.pathname;
    if (current === item.to) return true;
    return item.matchPaths?.some((p) => {
      if (current === p) return true;
      if (p === '/alertas' && current.startsWith('/alertas/')) return false;
      return current.startsWith(`${p}/`);
    });
  };

  // Botón "Volver": navega al hub de origen (state.from) o al mapeado por ruta.
  const backTarget = location.state?.from || SUBPAGE_HUB[location.pathname] || null;
  const backLabel = backTarget
    ? (mainNavItems.find((i) => i.to === backTarget)?.label || 'Inicio')
    : '';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: theme.fontBody,
        color: theme.ink,
        background: theme.cream,
      }}
    >
      {/* Sidebar con colapso a rail de iconos */}
      <nav
        aria-label="Menú principal"
        style={{
          width: rail ? 76 : 268,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${theme.maroonDeep} 0%, ${theme.maroon} 75%, #630C10 100%)`,
          padding: '1.1rem 0.8rem 1rem',
          color: theme.creamSoft,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          borderRight: `1px solid ${theme.maroonDeep}`,
          boxShadow: '4px 0 22px rgba(0,0,0,0.18)',
          transition: 'width 0.24s cubic-bezier(0.25, 1, 0.4, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header institucional */}
        <div
          style={{
            display: 'flex',
            gap: '0.7rem',
            alignItems: 'center',
            justifyContent: showLabel ? 'flex-start' : 'center',
            marginBottom: '1rem',
            padding: showLabel ? '0.15rem 0.35rem' : '0.15rem 0',
          }}
        >
          <img
            src="/logo-fz.png?v=3"
            alt="Facultad de Zootecnia"
            style={{
              width: 46,
              height: 46,
              objectFit: 'contain',
              background: theme.cream,
              borderRadius: '50%',
              padding: 3,
              border: `2px solid ${theme.creamSoft}`,
              display: 'block',
              boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
            }}
          />
          {showLabel && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: '1.06rem',
                  lineHeight: 1.15,
                  color: theme.creamSoft,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Control Animales
              </div>
              <div style={{ fontSize: '0.68rem', opacity: 0.8, letterSpacing: '0.08em', marginTop: 2 }}>
                FZ · UNAS Tingo María
              </div>
            </div>
          )}
        </div>

        {/* Botón colapsar / expandir */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={rail ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          aria-label={rail ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          style={{
            position: 'fixed',
            left: rail ? 76 - 15 : 268 - 15,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `1.5px solid ${theme.border}`,
            background: theme.creamSoft,
            color: theme.maroon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            transition: 'left 0.24s cubic-bezier(0.25, 1, 0.4, 1)',
            padding: 0,
          }}
        >
          {rail ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          )}
        </button>

        {/* Tarjeta de Granja Activa */}
        {granja && (
          <div
            style={{
              fontSize: '0.82rem',
              margin: '0 0 1rem',
              padding: showLabel ? '0.6rem 0.8rem' : '0.4rem',
              background: 'rgba(255,252,250,0.12)',
              borderRadius: theme.radiusSm,
              border: '1px solid rgba(245,239,227,0.25)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: showLabel ? 'space-between' : 'center',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {showLabel ? (
              <>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: '#FFF8F0', fontSize: '0.86rem' }}>{granja.especie}</strong>
                  <span style={{ opacity: 0.85, fontSize: '0.76rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {granja.nombre}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    seleccionarGranja(null);
                    localStorage.removeItem('farmId');
                    navigate('/seleccionar-granja');
                  }}
                  title="Cambiar granja"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.3rem 0.55rem',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Cambiar
                </button>
              </>
            ) : (
              <div
                title={`${granja.especie} · ${granja.nombre}`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: theme.radiusSm,
                  background: 'rgba(255,252,250,0.16)',
                  border: '1px solid rgba(245,239,227,0.3)',
                  color: '#FFF8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  letterSpacing: '0.04em',
                }}
              >
                {granja.especie.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Menú */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.1rem', scrollbarWidth: 'thin' }}>
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.id}
              style={{
                marginBottom: sectionIdx < navSections.length - 1 ? (showLabel ? '0.65rem' : '0.45rem') : 0,
              }}
            >
              {showLabel ? (
                <div
                  style={{
                    fontSize: '0.62rem',
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase',
                    opacity: 0.55,
                    margin: '0.35rem 0.55rem 0.45rem',
                    fontWeight: 800,
                  }}
                >
                  {section.label}
                </div>
              ) : (
                sectionIdx > 0 && (
                  <div
                    aria-hidden
                    style={{
                      height: 1,
                      background: 'rgba(245,239,227,0.18)',
                      margin: '0.35rem 0.65rem 0.45rem',
                    }}
                  />
                )
              )}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignContent: rail ? 'center' : 'stretch',
                }}
              >
                {section.items.map((item) => {
                  const active = isItemActive(item);
                  const badge =
                    item.badgeKey === 'alertasVencidas' && navBadges.alertasVencidas > 0
                      ? navBadges.alertasVencidas
                      : 0;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: showLabel ? 'flex-start' : 'center',
                          gap: '0.85rem',
                          padding: showLabel ? '0.72rem 0.9rem' : '0.72rem 0',
                          borderRadius: theme.radiusSm,
                          color: active ? theme.maroonDeep : 'rgba(255,248,240,0.92)',
                          background: active
                            ? 'linear-gradient(135deg, #FFFFFF 0%, #FDF8F2 100%)'
                            : 'rgba(255,255,255,0.03)',
                          fontWeight: active ? 750 : 500,
                          textDecoration: 'none',
                          boxShadow: active ? '0 8px 18px rgba(0,0,0,0.22)' : 'none',
                          border: active ? `1.5px solid ${theme.creamDeep}` : '1.5px solid transparent',
                          position: 'relative',
                          transition: 'all 160ms ease',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.color = 'rgba(255,248,240,0.92)';
                          }
                        }}
                      >
                        {active && (
                          <span
                            aria-hidden
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 4,
                              height: 20,
                              borderRadius: '0 6px 6px 0',
                              background: theme.maroon,
                            }}
                          />
                        )}
                        <span
                          style={{
                            color: active ? theme.maroon : 'rgba(255,248,240,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            marginLeft: showLabel ? 0 : 'auto',
                            marginRight: showLabel ? 0 : 'auto',
                            position: 'relative',
                          }}
                        >
                          {item.icon}
                          {badge > 0 && !showLabel && (
                            <span
                              aria-label={`${badge} alertas vencidas`}
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -6,
                                minWidth: 16,
                                height: 16,
                                padding: '0 4px',
                                borderRadius: 999,
                                background: '#FF6B35',
                                color: '#fff',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </span>
                        {showLabel && (
                          <span
                            style={{
                              fontSize: '0.96rem',
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <span>{item.label}</span>
                            {badge > 0 && (
                              <span
                                aria-label={`${badge} alertas vencidas`}
                                style={{
                                  minWidth: 20,
                                  height: 20,
                                  padding: '0 6px',
                                  borderRadius: 999,
                                  background: active ? theme.maroon : '#FF6B35',
                                  color: '#fff',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer del sidebar: versión, usuario y logout */}
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(245,239,227,0.2)', paddingTop: '0.85rem' }}>
          {showLabel && (
            <div
              style={{
                fontSize: '0.66rem',
                letterSpacing: '0.08em',
                opacity: 0.65,
                textTransform: 'uppercase',
                margin: '0 0.35rem 0.7rem',
              }}
            >
              Control Animales · v2.0 · FZ UNAS
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '0.75rem',
              padding: showLabel ? '0 0.35rem' : '0',
              justifyContent: showLabel ? 'flex-start' : 'center',
            }}
          >
            <div
              title={user?.nombre}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: theme.creamSoft,
                color: theme.maroonDeep,
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {initiales(user?.nombre)}
            </div>
            {showLabel && user && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#FFFFFF',
                  }}
                >
                  {user.nombre}
                </div>
                <div style={{ opacity: 0.75, fontSize: '0.74rem', textTransform: 'capitalize' }}>
                  {user.rol || 'Operador'}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            style={{
              background: theme.creamSoft,
              color: theme.maroonDeep,
              border: 'none',
              padding: showLabel ? '0.55rem 0.9rem' : '0.55rem 0',
              cursor: 'pointer',
              borderRadius: theme.radiusSm,
              fontWeight: 750,
              fontSize: '0.85rem',
              width: '100%',
              boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: showLabel ? 'center' : 'center',
              gap: '0.5rem',
              transition: 'filter 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.97)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {showLabel && <span>Cerrar sesión</span>}
          </button>
        </div>
      </nav>

      {/* Área de Contenido Principal */}
      <main
        style={{
          flex: 1,
          padding: '1.75rem 2rem 2.5rem',
          background: `
            radial-gradient(800px 400px at 100% 0%, rgba(122,18,22,0.05), transparent 60%),
            ${theme.cream}
          `,
          overflow: 'auto',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {backTarget && !HUB_PATHS.includes(location.pathname) && (
          <div style={{ marginBottom: '0.9rem' }}>
            <button
              type="button"
              onClick={() => navigate(backTarget)}
              title={`Volver a ${backLabel}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                color: theme.maroon,
                borderRadius: 999,
                padding: '0.38rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                boxShadow: '0 2px 8px rgba(79, 12, 16, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.maroon;
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = theme.maroon;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.maroon;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver a {backLabel}
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;