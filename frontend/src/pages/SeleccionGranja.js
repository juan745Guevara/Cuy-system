import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/ui';

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

  const [especieId, setEspecieId] = useState(especies.length === 1 ? especies[0].id : '');

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

  const field = {
    width: '100%',
    padding: '0.8rem 1rem',
    marginBottom: '1rem',
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    background: '#FFFEFB',
    color: theme.ink,
    fontFamily: theme.fontBody,
  };

  if (!granjas?.length) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          background: theme.cream,
          fontFamily: theme.fontBody,
          color: theme.ink,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>No tiene granjas asignadas. Contacte al administrador.</p>
        <button
          type="button"
          onClick={() => logout()}
          style={{
            marginTop: '1rem',
            padding: '0.65rem 1.2rem',
            background: theme.maroon,
            color: theme.creamSoft,
            border: 'none',
            cursor: 'pointer',
            borderRadius: theme.radiusSm,
            fontWeight: 700,
          }}
        >
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
        padding: '1.5rem',
        background: `
          radial-gradient(ellipse 65% 50% at 20% 20%, rgba(163,58,62,0.12), transparent 55%),
          linear-gradient(165deg, #F8F2E8 0%, ${theme.creamDeep} 100%)
        `,
        fontFamily: theme.fontBody,
      }}
    >
      <form
        onSubmit={handleContinue}
        style={{
          background: 'rgba(255,252,250,0.95)',
          padding: '2.1rem',
          width: '100%',
          maxWidth: 460,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusLg,
        }}
      >
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', marginBottom: '1.35rem' }}>
          <img
            src="/logo-fz.png?v=3"
            alt="Facultad de Zootecnia"
            style={{
              width: 56,
              height: 56,
              objectFit: 'contain',
              background: theme.cream,
              borderRadius: '50%',
              padding: 3,
              border: `2px solid ${theme.maroon}`,
              display: 'block',
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                color: theme.maroonDeep,
                fontFamily: theme.fontDisplay,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Contexto de trabajo
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: theme.muted, fontSize: '0.92rem' }}>
              Elija especie y granja para registrar
            </p>
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 6, color: theme.maroonDeep, fontWeight: 650 }}>
          Especie
        </label>
        <select
          value={especieId}
          onChange={(e) => {
            setEspecieId(e.target.value);
            setGranjaId('');
          }}
          required
          style={field}
        >
          <option value="">— Seleccione —</option>
          {especies.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>

        <label style={{ display: 'block', marginBottom: 6, color: theme.maroonDeep, fontWeight: 650 }}>
          Granja
        </label>
        <select
          value={granjaId}
          onChange={(e) => setGranjaId(e.target.value)}
          required
          disabled={!especieId}
          style={field}
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
            padding: '0.85rem',
            marginTop: '0.25rem',
            background: granjaId
              ? `linear-gradient(180deg, ${theme.maroonSoft} 0%, ${theme.maroon} 100%)`
              : theme.creamDeep,
            color: granjaId ? theme.creamSoft : theme.muted,
            border: 'none',
            borderRadius: theme.radiusSm,
            cursor: granjaId ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            fontFamily: theme.fontBody,
            boxShadow: granjaId ? '0 10px 22px rgba(122,18,22,0.22)' : 'none',
          }}
        >
          Continuar
        </button>
      </form>
    </div>
  );
};

export default SeleccionGranja;
