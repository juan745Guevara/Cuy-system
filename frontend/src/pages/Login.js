import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      if (data.granjas?.length === 1) navigate('/');
      else navigate('/seleccionar-granja');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #1b4332 0%, #40916c 55%, #d8f3dc 100%)',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '2rem',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        <p style={{ margin: 0, color: '#1b4332', fontSize: '0.85rem', letterSpacing: '0.08em' }}>
          FACULTAD DE ZOOTECNIA — UNAS
        </p>
        <h1 style={{ margin: '0.4rem 0 1.5rem', color: '#081c15', fontSize: '1.75rem' }}>
          Control de Animales
        </h1>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#fff0f0',
              color: '#9b2226',
              borderLeft: '3px solid #9b2226',
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 4, color: '#1b4332' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          style={{
            width: '100%',
            padding: '0.65rem',
            marginBottom: '1rem',
            border: '1px solid #95d5b2',
            borderRadius: 2,
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', marginBottom: 4, color: '#1b4332' }}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '0.65rem',
            marginBottom: '1.25rem',
            border: '1px solid #95d5b2',
            borderRadius: 2,
            boxSizing: 'border-box',
          }}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#1b4332',
            color: '#fff',
            border: 'none',
            borderRadius: 2,
            cursor: submitting ? 'wait' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
