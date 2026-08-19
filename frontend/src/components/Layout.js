import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: '250px', background: '#f5f5f5', padding: '20px' }}>
        <h2>Sistema de Control</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/animales">Animales</Link></li>
          <li><Link to="/partos">Partos</Link></li>
          <li><Link to="/inventario">Inventario</Link></li>
        </ul>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </nav>

      {/* Contenido principal */}
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
