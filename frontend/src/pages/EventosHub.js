import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { page as s, theme } from '../styles/ui';

const EVENTOS_LIST = [
  {
    id: 'empadres',
    title: 'Monta / Empadre',
    category: 'Reproducción',
    color: '#7A1216',
    bgBadge: 'rgba(122, 18, 22, 0.1)',
    desc: 'Registrar empadre por macho o por jaula, asignación de hembras, fechas y pesos.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    path: '/empadres',
    keywords: ['monta', 'empadre', 'cruce', 'macho', 'hembras', 'reproduccion', 'preñez'],
  },
  {
    id: 'partos',
    title: 'Partos y Camadas',
    category: 'Reproducción',
    color: '#9C27B0',
    bgBadge: 'rgba(156, 39, 176, 0.1)',
    desc: 'Registro de nacimientos, tamaño de camada, crías vivas/muertas, sexo y pesos al nacer.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    path: '/partos',
    keywords: ['parto', 'camada', 'nacimiento', 'crias', 'gazapos', 'peso nacimiento'],
  },
  {
    id: 'destetes',
    title: 'Destetes',
    category: 'Reproducción',
    color: '#E65100',
    bgBadge: 'rgba(230, 81, 0, 0.1)',
    desc: 'Separación de crías de la madre, recuento, pesaje y asignación a jaulas de recría.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    path: '/destetes',
    keywords: ['destete', 'separacion', 'recria', 'camada destete', 'peso destete'],
  },
  {
    id: 'mortalidad',
    title: 'Mortalidad y Bajas',
    category: 'Sanidad & Control',
    color: '#C62828',
    bgBadge: 'rgba(198, 40, 40, 0.1)',
    desc: 'Registro de muertes por categoría, raza, jaula o causa sanitaria/accidental.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    path: '/mortalidad',
    keywords: ['mortalidad', 'muerte', 'baja', 'deceso', 'causa', 'enfermedad'],
  },
  {
    id: 'pesajes',
    title: 'Pesajes y Crecimiento',
    category: 'Manejo',
    color: '#2E7D32',
    bgBadge: 'rgba(46, 125, 50, 0.1)',
    desc: 'Pesaje individual o por lote (jaula completa), evolución y ganancia de peso.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18" />
        <path d="M3 10h18" />
        <path d="M6 10l-3 6h6l-3-6z" />
        <path d="M18 10l-3 6h6l-3-6z" />
      </svg>
    ),
    path: '/pesajes',
    keywords: ['pesaje', 'peso', 'gramos', 'lote', 'crecimiento', 'balanza'],
  },
  {
    id: 'sanidad',
    title: 'Sanidad y Tratamientos',
    category: 'Sanidad & Control',
    color: '#00838F',
    bgBadge: 'rgba(0, 131, 143, 0.1)',
    desc: 'Registro de tratamientos preventivos o curativos, dosis, producto, vía y seguimiento.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 7v6" />
        <path d="M9 10h6" />
      </svg>
    ),
    path: '/sanidad',
    keywords: ['sanidad', 'tratamiento', 'medicamento', 'dosis', 'vacuna', 'antibiotico', 'enfermedad'],
  },
  {
    id: 'movimientos',
    title: 'Movimientos y Traslados',
    category: 'Manejo',
    color: '#1565C0',
    bgBadge: 'rgba(21, 101, 192, 0.1)',
    desc: 'Traslados internos de jaula a jaula, por área o transferencias entre granjas.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    path: '/movimientos',
    keywords: ['movimiento', 'traslado', 'jaula', 'transferencia', 'cambio jaula', 'reubicacion'],
  },
  {
    id: 'alertas',
    title: 'Alertas del Ciclo',
    category: 'Planificación',
    color: '#D84315',
    bgBadge: 'rgba(216, 67, 21, 0.1)',
    desc: 'Avisos automáticos de partos próximos, destetes pendientes y revisiones.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    path: '/alertas',
    keywords: ['alertas', 'parto proximo', 'destete pendiente', 'plazos', 'vencidos', 'avisos'],
  },
  {
    id: 'ranking',
    title: 'Ranking de Reproductores',
    category: 'Genética',
    color: '#6A1B9A',
    bgBadge: 'rgba(106, 27, 154, 0.1)',
    desc: 'Evaluación de desempeño, camadas promedio, fertilidad y selección de élite / descarte.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    path: '/ranking',
    keywords: ['ranking', 'elite', 'reproductores', 'rendimiento', 'descarte', 'fertilidad', 'mejoramiento'],
  },
];

const EventosHub = () => {
  const [query, setQuery] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [alertasCount, setAlertasCount] = useState({ vencidas: 0, proximas: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/alertas')
      .then((res) => {
        const data = res.data;
        setAlertasCount({
          vencidas: data?.vencidas?.length || 0,
          proximas: data?.proximas?.length || 0,
        });
      })
      .catch(() => {});
  }, []);

  const categorias = ['Todos', 'Reproducción', 'Sanidad & Control', 'Manejo', 'Planificación', 'Genética'];

  const filtered = EVENTOS_LIST.filter((ev) => {
    const matchCat = categoriaSel === 'Todos' || ev.category === categoriaSel;
    const q = query.trim().toLowerCase();
    if (!q) return matchCat;
    const matchText =
      ev.title.toLowerCase().includes(q) ||
      ev.desc.toLowerCase().includes(q) ||
      ev.keywords.some((k) => k.toLowerCase().includes(q));
    return matchCat && matchText;
  });

  return (
    <div style={s.wrap}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem' }}>
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
          Flujo Operativo del Criadero
        </p>
        <h1 style={{ ...s.title, marginBottom: 6 }}>Registro y Control de Eventos</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Selecciona o busca el evento productivo que deseas realizar según las normas técnicas de la Facultad de Zootecnia.
        </p>
      </div>

      {/* Buscador de Evento */}
      <div
        style={{
          background: theme.creamSoft,
          padding: '1.25rem 1.4rem',
          borderRadius: theme.radiusLg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.muted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="¿Qué evento deseas realizar? (ej: Monta, Parto, Destete, Mortalidad, Pesaje, Sanidad...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                ...s.input,
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: '2.6rem',
                fontSize: '0.98rem',
                borderRadius: theme.radiusSm,
                border: `1.5px solid ${query ? theme.maroon : theme.border}`,
                background: '#FFFFFF',
              }}
              autoFocus
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                ...s.btnGhost,
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Chips de filtro por categoría */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {categorias.map((cat) => {
            const active = categoriaSel === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSel(cat)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  borderRadius: 20,
                  border: active ? `1.5px solid ${theme.maroon}` : `1px solid ${theme.border}`,
                  background: active ? theme.maroon : theme.creamSoft,
                  color: active ? '#FFFFFF' : theme.ink,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alertas rápidas informativas si existen */}
      {(alertasCount.vencidas > 0 || alertasCount.proximas > 0) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
            border: '1px solid #FFB74D',
            borderRadius: theme.radius,
            padding: '0.85rem 1.15rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#E65100', display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <div>
              <strong style={{ color: '#BF360C', fontSize: '0.92rem' }}>
                Atención: Hay eventos reproductivos pendientes
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#E65100' }}>
                {alertasCount.vencidas} vencidas · {alertasCount.proximas} próximas en los próximos días
              </div>
            </div>
          </div>
          <Link
            to="/alertas"
            style={{
              padding: '0.45rem 0.9rem',
              background: '#E65100',
              color: '#FFFFFF',
              borderRadius: theme.radiusSm,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            Ver Alertas →
          </Link>
        </div>
      )}

      {/* Grid de Tarjetas de Eventos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filtered.map((ev) => (
          <div
            key={ev.id}
            onClick={() => navigate(ev.path, { state: { from: '/eventos' } })}
            style={{
              background: theme.creamSoft,
              border: `1.5px solid ${theme.border}`,
              borderRadius: theme.radiusLg,
              padding: '1.35rem 1.4rem',
              cursor: 'pointer',
              boxShadow: theme.shadowSoft,
              transition: 'all 180ms ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ev.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(79, 12, 16, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadowSoft;
            }}
          >
            <div>
              {/* Header de la tarjeta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: theme.radius,
                    background: ev.bgBadge,
                    color: ev.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ev.icon}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.6rem',
                      background: ev.bgBadge,
                      color: ev.color,
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {ev.category}
                  </span>
                </div>
              </div>

              {/* Título y descripción */}
              <h3
                style={{
                  margin: '0 0 0.45rem',
                  color: theme.maroonDeep,
                  fontSize: '1.2rem',
                  fontFamily: theme.fontDisplay,
                  fontWeight: 700,
                }}
              >
                {ev.title}
              </h3>
              <p
                style={{
                  margin: '0 0 1.15rem',
                  color: theme.muted,
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                }}
              >
                {ev.desc}
              </p>
            </div>

            {/* Botón de acción directo */}
            <div
              style={{
                borderTop: `1px solid ${theme.border}`,
                paddingTop: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: ev.color }}>
                Registrar / Consultar
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: ev.bgBadge,
                  color: ev.color,
                }}
              >
                →
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            ...s.card,
            textAlign: 'center',
            padding: '3rem 2rem',
            color: theme.muted,
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ color: theme.maroonDeep, margin: '0 0 0.5rem' }}>No se encontraron eventos</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>
            No hay ningún evento o acción que coincida con "{query}".
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategoriaSel('Todos');
            }}
            style={s.btn}
          >
            Ver todos los eventos
          </button>
        </div>
      )}
    </div>
  );
};

export default EventosHub;
