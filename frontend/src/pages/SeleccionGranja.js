import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** NUC-02: elegir especie y luego granja activa. */
const SeleccionGranja = () => {
  const { granjas, seleccionarGranja, logout } = useAuth();
  const navigate = useNavigate();

  const especies = useMemo(() => {
    const map = new Map();
    (granjas || []).forEach((g) => {
      if (!map.has(g.id_especie)) {
        map.set(g.id_especie, { id: g.id_especie, nombre: g.especie });
      }
    });
    return Array.from(map.values());
  }, [granjas]);

  const [especieId, setEspecieId] = useState(
    especies.length === 1 ? especies[0].id : ''
  );

  const granjasFiltradas = useMemo(
    () => (granjas || []).filter((g) => !especieId || g.id_especie === Number(especieId)),
    [granjas, especieId]
  );

  const [granjaId, setGranjaId] = useState(
    granjasFiltradas.length === 1 ? granjasFiltradas[0].id : ''
  );

  const handleContinue = (e) => {
    e.preventDefault();
    if (!granjaId) return;
    seleccionarGranja(Number(granjaId));
    navigate('/');
  };

  if (!granjas?.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No tiene granjas asignadas. Contacte al administrador.</p>
        <button type="button" onClick={() => logout()}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f7f4',
        fontFamily: 'Georgia, serif',
      }}
    >
      <form
        onSubmit={handleContinue}
        style={{
          background: '#fff',
          padding: '2rem',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ marginTop: 0, color: '#1b4332' }}>Contexto de trabajo</h1>
        <p style={{ color: '#52796f' }}>
          Elija primero la especie y luego la granja donde va a registrar.
        </p>

        <label style={{ display: 'block', marginBottom: 4 }}>Especie</label>
        <select
          value={especieId}
          onChange={(e) => {
            setEspecieId(e.target.value);
            setGranjaId('');
          }}
          required
          style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem' }}
        >
          <option value="">— Seleccione —</option>
          {especies.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>

        <label style={{ display: 'block', marginBottom: 4 }}>Granja</label>
        <select
          value={granjaId}
          onChange={(e) => setGranjaId(e.target.value)}
          required
          disabled={!especieId}
          style={{ width: '100%', padding: '0.6rem', marginBottom: '1.25rem' }}
        >
          <option value="">— Seleccione —</option>
          {granjasFiltradas.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!granjaId}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#1b4332',
            color: '#fff',
            border: 'none',
            cursor: granjaId ? 'pointer' : 'not-allowed',
          }}
        >
          Continuar
        </button>
      </form>
    </div>
  );
};

export default SeleccionGranja;
