import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, granjas, granjaActiva, seleccionarGranja, logout } = useAuth();
  const navigate = useNavigate();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: '250px', background: '#f5f5f5', padding: '20px' }}>
        <h2>Sistema de Control</h2>
        {granja && (
          <p style={{ fontSize: '0.9rem', color: '#333' }}>
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
          style={{ marginBottom: '1rem', fontSize: '0.85rem' }}
        >
          Cambiar granja
        </button>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/animales">Animales</Link></li>
          <li><Link to="/partos">Partos</Link></li>
          <li><Link to="/inventario">Inventario</Link></li>
        </ul>
        <p style={{ fontSize: '0.85rem' }}>{user?.nombre}</p>
        <button type="button" onClick={handleLogout}>Cerrar sesión</button>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
