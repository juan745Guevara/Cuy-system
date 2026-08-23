import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { page as s } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** NUC-03 panel · NUC-33 alertas en inicio */
const Dashboard = () => {
  const { granjaActiva, granjas } = useAuth();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);
  const [pob, setPob] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState(null);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('/inventario/poblacion'),
      api.get('/inventario/resumen-mensual', {
        params: { anio: now.getFullYear(), mes: now.getMonth() + 1 },
      }),
      api.get('/alertas').catch(() => ({ data: null })),
    ])
      .then(([p, r, a]) => {
        setPob(p.data);
        setResumen(r.data);
        setAlertas(a.data);
      })
      .catch(() => {});
  }, []);

  const card = {
    padding: '1.25rem',
    background: '#fff',
    border: '1px solid #95d5b2',
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Inicio</h1>
      <p style={s.sub}>
        {granja ? `${granja.especie} · ${granja.nombre}` : 'Granja activa'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#1b4332' }}>Población</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{pob?.total ?? '—'}</p>
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#1b4332' }}>Nacimientos</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>
            {resumen?.nacimientos ?? '—'}
          </p>
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#1b4332' }}>Bajas del mes</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>
            {resumen == null ? '—' : (resumen.mortalidad ?? 0) + (resumen.ventas ?? 0)}
          </p>
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0, color: '#1b4332' }}>Alertas</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>
            {alertas?.vencidas?.length ?? '—'}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {alertas?.proximas?.length ?? 0} próximas
          </p>
        </div>
      </div>

      {alertas?.vencidas?.length > 0 && (
        <div style={{ ...s.card, marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Alertas vencidas</h3>
          <ul>
            {alertas.vencidas.slice(0, 5).map((a) => (
              <li key={a.key}>
                {a.mensaje} · {a.fecha_prevista}{' '}
                <Link to={a.ruta || '/alertas'}>Ir</Link>
              </li>
            ))}
          </ul>
          <Link to="/alertas">Ver todas</Link>
        </div>
      )}

      <div style={{ ...s.row, marginTop: '1.5rem' }}>
        <Link to="/animales" style={s.btn}>
          Animales
        </Link>
        <Link to="/empadres" style={s.btnGhost}>
          Empadres
        </Link>
        <Link to="/movimientos" style={s.btnGhost}>
          Movimientos
        </Link>
        <Link to="/pesajes" style={s.btnGhost}>
          Pesajes
        </Link>
        <Link to="/inventario" style={s.btnGhost}>
          Inventario / Excel
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
