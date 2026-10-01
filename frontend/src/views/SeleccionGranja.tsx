'use client';

import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../context/AuthContext';
import { theme } from '@/lib/ui';

/** Elegir especie y luego granja activa. */
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

  const especieUnica = especies.length === 1 ? especies[0] : null;
  const [especieElegida, setEspecieId] = useState<number | string>('');
  const especieId = especieUnica ? especieUnica.id : especieElegida;

  const granjasFiltradas = useMemo(
    () => (granjas || []).filter((g) => !especieId || g.id_especie === Number(especieId)),
    [granjas, especieId]
  );

  const [farmElegida, setGranjaId] = useState<number | string>('');
  const farmId = granjasFiltradas.length === 1 ? granjasFiltradas[0].id : farmElegida;

  const nombreEspecie = especieUnica?.nombre
    ? especieUnica.nombre.charAt(0).toUpperCase() + especieUnica.nombre.slice(1)
    : '';

  const handleContinue = (e) => {
    e.preventDefault();
    if (!farmId) return;
    seleccionarGranja(Number(farmId));
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
              {especieUnica ? `${nombreEspecie} · elija la granja` : 'Elija especie y granja para registrar'}
            </p>
          </div>
        </div>

        {!especieUnica && (
          <>
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
                  {e.nombre ? e.nombre.charAt(0).toUpperCase() + e.nombre.slice(1) : e.nombre}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={{ display: 'block', marginBottom: 6, color: theme.maroonDeep, fontWeight: 650 }}>
          Granja
        </label>
        <select
          value={farmId}
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
          disabled={!farmId}
          style={{
            width: '100%',
            padding: '0.85rem',
            marginTop: '0.25rem',
            background: farmId
              ? `linear-gradient(180deg, ${theme.maroonSoft} 0%, ${theme.maroon} 100%)`
              : theme.creamDeep,
            color: farmId ? theme.creamSoft : theme.muted,
            border: 'none',
            borderRadius: theme.radiusSm,
            cursor: farmId ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            fontFamily: theme.fontBody,
            boxShadow: farmId ? '0 10px 22px rgba(122,18,22,0.22)' : 'none',
          }}
        >
          Continuar
        </button>
      </form>
    </div>
  );
};

export default SeleccionGranja;
