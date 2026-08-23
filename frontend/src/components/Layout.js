import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/ui';

const navGroups = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Inicio', exact: true },
      { to: '/animales', label: 'Animales' },
      { to: '/areas', label: 'Áreas' },
      { to: '/jaulas', label: 'Jaulas' },
      { to: '/catalogos', label: 'Catálogos' },
    ],
  },
  {
    label: 'Ciclo productivo',
    items: [
      { to: '/reproductoras', label: 'Reproductoras' },
      { to: '/reproductores', label: 'Reproductores' },
      { to: '/empadres', label: 'Empadres' },
      { to: '/partos', label: 'Partos' },
      { to: '/destetes', label: 'Destetes' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { to: '/mortalidad', label: 'Mortalidad' },
      { to: '/ventas', label: 'Ventas' },
      { to: '/movimientos', label: 'Movimientos' },
      { to: '/pesajes', label: 'Pesajes' },
      { to: '/sanidad', label: 'Sanidad' },
      { to: '/alertas', label: 'Alertas' },
      { to: '/ranking', label: 'Ranking' },
      { to: '/inventario', label: 'Inventario' },
    ],
  },
];

const linkStyle = (active) => ({
  display: 'block',
  padding: '0.55rem 0.9rem',
  marginBottom: 4,
  borderRadius: theme.radiusSm,
  color: active ? theme.maroonDeep : 'rgba(255,248,240,0.88)',
  background: active ? theme.creamSoft : 'transparent',
  fontWeight: active ? 700 : 500,
  textDecoration: 'none',
  boxShadow: active ? '0 6px 14px rgba(0,0,0,0.12)' : 'none',
  transition: 'background 160ms ease, color 160ms ease, transform 160ms ease',
});

const Layout = () => {
  const { user, granjas, granjaActiva, seleccionarGranja, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const is = (path, exact) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

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
      <nav
        style={{
          width: 260,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${theme.maroonDeep} 0%, ${theme.maroon} 70%, #8E1F24 100%)`,
          padding: '1.15rem 0.9rem 1rem',
          color: theme.creamSoft,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          borderRight: `1px solid ${theme.maroonDeep}`,
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.1rem', padding: '0.2rem 0.35rem' }}>
          <img
            src="/logo-fz.png?v=3"
            alt="Facultad de Zootecnia"
            style={{
              width: 58,
              height: 58,
              objectFit: 'contain',
              background: theme.cream,
              borderRadius: '50%',
              padding: 3,
              border: `2px solid ${theme.creamSoft}`,
              display: 'block',
              boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
            }}
          />
          <div>
            <div
              style={{
                fontFamily: theme.fontDisplay,
                fontSize: '1.05rem',
                lineHeight: 1.15,
                color: theme.creamSoft,
              }}
            >
              Control Animales
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.8, letterSpacing: '0.06em', marginTop: 2 }}>
              FZ · UNAS
            </div>
          </div>
        </div>

        {granja && (
          <div
            style={{
              fontSize: '0.84rem',
              margin: '0 0 0.7rem',
              padding: '0.7rem 0.85rem',
              background: 'rgba(255,252,250,0.1)',
              borderRadius: theme.radiusSm,
              border: '1px solid rgba(245,239,227,0.22)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 2 }}>{granja.especie}</strong>
            <span style={{ opacity: 0.9 }}>{granja.nombre}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            seleccionarGranja(null);
            localStorage.removeItem('granjaId');
            navigate('/seleccionar-granja');
          }}
          style={{
            marginBottom: '0.9rem',
            fontSize: '0.8rem',
            background: 'rgba(255,252,250,0.08)',
            border: '1px solid rgba(245,239,227,0.35)',
            color: theme.creamSoft,
            padding: '0.45rem 0.85rem',
            cursor: 'pointer',
            borderRadius: theme.radiusSm,
            alignSelf: 'flex-start',
            fontWeight: 600,
          }}
        >
          Cambiar granja
        </button>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '0.85rem' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                  margin: '0.35rem 0.75rem 0.35rem',
                  fontWeight: 700,
                }}
              >
                {group.label}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link style={linkStyle(is(item.to, item.exact))} to={item.to}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {admin && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                  margin: '0.35rem 0.75rem 0.35rem',
                  fontWeight: 700,
                }}
              >
                Administración
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li>
                  <Link style={linkStyle(is('/usuarios'))} to="/usuarios">
                    Usuarios
                  </Link>
                </li>
                <li>
                  <Link style={linkStyle(is('/granjas'))} to="/granjas">
                    Granjas
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '0.75rem',
            borderTop: '1px solid rgba(245,239,227,0.2)',
            paddingTop: '0.9rem',
          }}
        >
          <p style={{ fontSize: '0.84rem', margin: '0 0 0.65rem', opacity: 0.92, padding: '0 0.35rem' }}>
            {user?.nombre}
            <br />
            <span style={{ opacity: 0.7, fontSize: '0.78rem' }}>{user?.rol}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: theme.creamSoft,
              color: theme.maroonDeep,
              border: 'none',
              padding: '0.6rem 0.9rem',
              cursor: 'pointer',
              borderRadius: theme.radiusSm,
              fontWeight: 700,
              width: '100%',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          padding: '1.5rem 1.75rem 2rem',
          background: `
            radial-gradient(700px 360px at 100% 0%, rgba(122,18,22,0.06), transparent 55%),
            ${theme.cream}
          `,
          overflow: 'auto',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
