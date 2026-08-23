import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { page as s, theme } from '../styles/ui';
import { useAuth } from '../context/AuthContext';

/** NUC-03 panel · NUC-33 alertas en inicio */
const Dashboard = () => {
  const { granjaActiva, granjas } = useAuth();
  const granja = (granjas || []).find((g) => g.id === granjaActiva);
  const [pob, setPob] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [porArea, setPorArea] = useState([]);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('/inventario/poblacion'),
      api.get('/inventario/resumen-mensual', {
        params: { anio: now.getFullYear(), mes: now.getMonth() + 1 },
      }),
      api.get('/alertas').catch(() => ({ data: null })),
      api.get('/jaulas/ocupacion').catch(() => ({ data: null })),
      api.get('/inventario/por-area').catch(() => ({ data: [] })),
    ])
      .then(([p, r, a, o, pa]) => {
        setPob(p.data);
        setResumen(r.data);
        setAlertas(a.data);
        setOcupacion(o.data);
        setPorArea(pa.data || []);
      })
      .catch(() => {});
  }, []);

  const metrics = [
    { label: 'Población', value: pob?.total ?? '—', hint: 'Animales activos' },
    { label: 'Nacimientos', value: resumen?.nacimientos ?? '—', hint: 'Mes en curso' },
    {
      label: 'Bajas del mes',
      value: resumen == null ? '—' : (resumen.mortalidad ?? 0) + (resumen.ventas ?? 0),
      hint: 'Mortalidad + ventas',
    },
    {
      label: 'Alertas',
      value: alertas?.vencidas?.length ?? '—',
      hint: `${alertas?.proximas?.length ?? 0} próximas`,
    },
  ];

  const sobrecupo = ocupacion?.sobrecupo || [];
  const porCategoria = pob?.por_categoria || [];

  return (
    <div style={s.wrap}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 0.35rem',
              color: theme.maroon,
              fontSize: '0.78rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Panel de la granja
          </p>
          <h1 style={{ ...s.title, marginBottom: 4 }}>Inicio</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>
            {granja ? `${granja.especie} · ${granja.nombre}` : 'Granja activa'}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: '1.35rem 1.3rem',
              background: `linear-gradient(160deg, ${theme.creamSoft} 0%, #F7F0E6 100%)`,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              boxShadow: theme.shadowSoft,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -18,
                right: -18,
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(122,18,22,0.06)',
              }}
            />
            <div
              style={{
                fontSize: '0.82rem',
                color: theme.muted,
                fontWeight: 650,
                marginBottom: 6,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: '2.15rem',
                margin: 0,
                fontWeight: 700,
                color: theme.maroonDeep,
                fontFamily: theme.fontDisplay,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {m.value}
            </div>
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: theme.muted }}>{m.hint}</div>
          </div>
        ))}
      </div>

      {sobrecupo.length > 0 && (
        <div style={{ ...s.card, marginTop: '1.25rem', borderRadius: theme.radius }}>
          <h3 style={{ marginTop: 0, color: theme.maroonDeep, fontFamily: theme.fontDisplay }}>
            Jaulas sobre capacidad (NUC-18)
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {sobrecupo.map((j) => (
              <li key={j.id}>
                {j.area} · {j.codigo}: {j.ocupacion}/{j.capacidad_maxima}
              </li>
            ))}
          </ul>
          <Link to="/jaulas" style={{ color: theme.maroon, fontWeight: 700 }}>
            Ver jaulas →
          </Link>
        </div>
      )}

      {(porCategoria.length > 0 || porArea.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginTop: '1.25rem',
          }}
        >
          {porCategoria.length > 0 && (
            <div style={{ ...s.card, borderRadius: theme.radius, margin: 0 }}>
              <h3 style={{ marginTop: 0, fontFamily: theme.fontDisplay }}>Por categoría</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {porCategoria.slice(0, 8).map((c, i) => (
                  <li key={i}>
                    {c.categoria || c.nombre}: {c.cantidad ?? c.total ?? 0}
                    {c.sexo ? ` (${c.sexo})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {porArea.length > 0 && (
            <div style={{ ...s.card, borderRadius: theme.radius, margin: 0 }}>
              <h3 style={{ marginTop: 0, fontFamily: theme.fontDisplay }}>Ocupación por área</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {porArea.map((a) => (
                  <li key={a.id}>
                    {a.nombre}: {a.total} animales · {a.jaulas?.length || 0} jaulas
                  </li>
                ))}
              </ul>
              <Link to="/inventario" style={{ color: theme.maroon, fontWeight: 700 }}>
                Ver inventario →
              </Link>
            </div>
          )}
        </div>
      )}

      {alertas?.vencidas?.length > 0 && (
        <div style={{ ...s.card, marginTop: '1.25rem', borderRadius: theme.radius }}>
          <h3 style={{ marginTop: 0, color: theme.maroonDeep, fontFamily: theme.fontDisplay }}>
            Alertas vencidas
          </h3>
          <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.1rem' }}>
            {alertas.vencidas.slice(0, 5).map((a) => (
              <li key={a.key} style={{ marginBottom: 6 }}>
                {a.mensaje} · {a.fecha_prevista}{' '}
                <Link to={a.ruta || '/alertas'} style={{ color: theme.maroon, fontWeight: 650 }}>
                  Ir
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/alertas" style={{ color: theme.maroon, fontWeight: 700 }}>
            Ver todas →
          </Link>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            color: theme.muted,
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Accesos rápidos
        </p>
        <div style={s.row}>
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
    </div>
  );
};

export default Dashboard;
