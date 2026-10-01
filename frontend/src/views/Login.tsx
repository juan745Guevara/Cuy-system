'use client';

import React, { useState, type CSSProperties } from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../context/AuthContext';
import { theme } from '@/lib/ui';
import { isSuperadmin, SUPERADMIN_HOME } from '@/lib/roles';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      if (isSuperadmin(data.user?.rol)) {
        navigate(SUPERADMIN_HOME);
        return;
      }
      if (data.granjas?.length === 1) navigate('/');
      else navigate('/seleccionar-granja');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const field: CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    marginBottom: '1rem',
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    background: '#FFFEFB',
    color: theme.ink,
    fontFamily: theme.fontBody,
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 2px rgba(79,12,16,0.04)',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        background: `
          radial-gradient(ellipse 70% 55% at 15% 15%, rgba(163,58,62,0.16), transparent 55%),
          radial-gradient(ellipse 60% 45% at 85% 85%, rgba(122,18,22,0.12), transparent 50%),
          linear-gradient(155deg, #F8F2E8 0%, ${theme.cream} 50%, #E8DFD0 100%)
        `,
        fontFamily: theme.fontBody,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 430,
          padding: '2.4rem 2.1rem 2.1rem',
          background: 'rgba(255,252,250,0.92)',
          borderRadius: theme.radiusLg,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 28px 60px rgba(79,12,16,0.14)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <img
            src="/logo-fz.png?v=3"
            alt="Facultad de Zootecnia — UNAS"
            style={{
              width: 118,
              height: 118,
              objectFit: 'contain',
              marginBottom: '1rem',
              background: theme.cream,
              borderRadius: '50%',
              padding: 6,
              border: `3px solid ${theme.maroon}`,
              display: 'inline-block',
              boxShadow: '0 14px 28px rgba(122,18,22,0.18)',
            }}
          />
          <p
            style={{
              margin: 0,
              color: theme.maroon,
              fontSize: '0.76rem',
              letterSpacing: '0.14em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Facultad de Zootecnia · UNAS
          </p>
          <h1
            style={{
              margin: '0.5rem 0 0',
              color: theme.maroonDeep,
              fontSize: '1.85rem',
              fontFamily: theme.fontDisplay,
              fontWeight: 650,
              letterSpacing: '-0.02em',
            }}
          >
            Control de Animales
          </h1>
          <p style={{ margin: '0.45rem 0 0', color: theme.muted, fontSize: '0.98rem' }}>
            Registro productivo de la unidad
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              background: theme.errorBg,
              color: theme.danger,
              borderRadius: theme.radiusSm,
              border: '1px solid rgba(155,28,31,0.15)',
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 6, color: theme.maroonDeep, fontWeight: 650 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          style={field}
        />

        <label style={{ display: 'block', marginBottom: 6, color: theme.maroonDeep, fontWeight: 650 }}>
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={field}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.9rem',
            marginTop: '0.35rem',
            background: `linear-gradient(180deg, ${theme.maroonSoft} 0%, ${theme.maroon} 100%)`,
            color: theme.creamSoft,
            border: 'none',
            borderRadius: theme.radiusSm,
            cursor: submitting ? 'wait' : 'pointer',
            fontSize: '1.02rem',
            fontWeight: 700,
            fontFamily: theme.fontBody,
            letterSpacing: '0.02em',
            boxShadow: '0 12px 24px rgba(122,18,22,0.25)',
          }}
        >
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
