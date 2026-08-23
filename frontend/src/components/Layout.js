import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkStyle = (active) => ({
  display: 'block',
  padding: '0.35rem 0',
  color: active ? '#081c15' : '#1b4332',
  fontWeight: active ? 700 : 400,
  textDecoration: 'none',
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

  const is = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <nav
        style={{
          width: 250,
          background: '#d8f3dc',
          padding: '1.25rem',
          borderRight: '1px solid #95d5b2',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#1b4332', fontSize: '1.15rem' }}>Control Animales</h2>
        {granja && (
          <p style={{ fontSize: '0.9rem', color: '#081c15' }}>
            <strong>{granja.especie}</strong>
            <br />
            {granja.nombre}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            seleccionarGranja(null);
            localStorage.removeItem('granjaId');
            navigate('/seleccionar-granja');
          }}
          style={{
            marginBottom: '1rem',
            fontSize: '0.8rem',
            background: 'transparent',
            border: '1px solid #1b4332',
            padding: '0.35rem 0.5rem',
            cursor: 'pointer',
          }}
        >
          Cambiar granja
        </button>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li><Link style={linkStyle(is('/') && location.pathname === '/')} to="/">Inicio</Link></li>
          <li><Link style={linkStyle(is('/animales'))} to="/animales">Animales</Link></li>
          <li><Link style={linkStyle(is('/areas'))} to="/areas">Áreas</Link></li>
          <li><Link style={linkStyle(is('/jaulas'))} to="/jaulas">Jaulas</Link></li>
          <li><Link style={linkStyle(is('/catalogos'))} to="/catalogos">Catálogos</Link></li>
          <li><Link style={linkStyle(is('/empadres'))} to="/empadres">Empadres</Link></li>
          <li><Link style={linkStyle(is('/partos'))} to="/partos">Partos</Link></li>
          <li><Link style={linkStyle(is('/destetes'))} to="/destetes">Destetes</Link></li>
          <li><Link style={linkStyle(is('/mortalidad'))} to="/mortalidad">Mortalidad</Link></li>
          <li><Link style={linkStyle(is('/ventas'))} to="/ventas">Ventas</Link></li>
          <li><Link style={linkStyle(is('/inventario'))} to="/inventario">Inventario</Link></li>
          {admin && (
            <>
              <li><Link style={linkStyle(is('/usuarios'))} to="/usuarios">Usuarios</Link></li>
              <li><Link style={linkStyle(is('/granjas'))} to="/granjas">Granjas</Link></li>
            </>
          )}
        </ul>
        <p style={{ fontSize: '0.85rem', marginTop: '1.5rem' }}>{user?.nombre} · {user?.rol}</p>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: '#1b4332',
            color: '#fff',
            border: 'none',
            padding: '0.45rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </nav>

      <main style={{ flex: 1, padding: '1.5rem', background: '#f8fff9' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
