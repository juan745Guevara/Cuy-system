import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import SeleccionGranja from './pages/SeleccionGranja';
import Dashboard from './pages/Dashboard';
import Animales from './pages/Animales';
import Areas from './pages/Areas';
import Jaulas from './pages/Jaulas';
import Catalogos from './pages/Catalogos';
import Empadres from './pages/Empadres';
import Reproductoras from './pages/Reproductoras';
import Reproductores from './pages/Reproductores';
import Partos from './pages/Partos';
import Destetes from './pages/Destetes';
import Mortalidad from './pages/Mortalidad';
import Ventas from './pages/Ventas';
import Inventario from './pages/Inventario';
import Usuarios from './pages/Usuarios';
import Granjas from './pages/Granjas';
import Movimientos from './pages/Movimientos';
import Pesajes from './pages/Pesajes';
import Sanidad from './pages/Sanidad';
import Alertas from './pages/Alertas';
import Ranking from './pages/Ranking';
import Auditoria from './pages/Auditoria';

function RequireGranja() {
  const { granjaActiva } = useAuth();
  if (!granjaActiva) return <Navigate to="/seleccionar-granja" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="seleccionar-granja" element={<SeleccionGranja />} />
            <Route element={<RequireGranja />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="animales" element={<Animales />} />
                <Route path="areas" element={<Areas />} />
                <Route path="jaulas" element={<Jaulas />} />
                <Route path="catalogos" element={<Catalogos />} />
                <Route path="empadres" element={<Empadres />} />
                <Route path="reproductoras" element={<Reproductoras />} />
                <Route path="reproductores" element={<Reproductores />} />
                <Route path="partos" element={<Partos />} />
                <Route path="destetes" element={<Destetes />} />
                <Route path="mortalidad" element={<Mortalidad />} />
                <Route path="ventas" element={<Ventas />} />
                <Route path="movimientos" element={<Movimientos />} />
                <Route path="pesajes" element={<Pesajes />} />
                <Route path="sanidad" element={<Sanidad />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="auditoria" element={<Auditoria />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="granjas" element={<Granjas />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
