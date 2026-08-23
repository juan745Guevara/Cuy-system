import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import SeleccionGranja from './pages/SeleccionGranja';
import Dashboard from './pages/Dashboard';
import Animales from './pages/Animales';
import Partos from './pages/Partos';
import Inventario from './pages/Inventario';

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
                <Route path="partos" element={<Partos />} />
                <Route path="inventario" element={<Inventario />} />
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
