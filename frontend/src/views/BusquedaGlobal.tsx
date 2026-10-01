'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '@/lib/navigation';
import api from '@/lib/api';
import { page as s, theme } from '@/lib/ui';

const BusquedaGlobal = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    animales: [],
    jaulas: [],
    areas: [],
    ventas: [],
    empadres: [],
    partos: [],
    mortalidad: [],
    pesajes: [],
    usuarios: [],
  });
  const navigate = useNavigate();

  // Cargar datos del sistema para búsqueda general instantánea
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [anRes, jRes, arRes, vRes, empRes, pRes, mRes, uRes] = await Promise.allSettled([
        api.get('/cuyes/animals'),
        api.get('/recintos'),
        api.get('/areas'),
        api.get('/cuyes/sales'),
        api.get('/cuyes/breedings'),
        api.get('/cuyes/births'),
        api.get('/cuyes/mortality'),
        api.get('/users'),
      ]);

      setData({
        animales: anRes.status === 'fulfilled' ? anRes.value.data.data || anRes.value.data || [] : [],
        jaulas: jRes.status === 'fulfilled' ? jRes.value.data || [] : [],
        areas: arRes.status === 'fulfilled' ? arRes.value.data || [] : [],
        ventas: vRes.status === 'fulfilled' ? vRes.value.data || [] : [],
        empadres: empRes.status === 'fulfilled' ? empRes.value.data || [] : [],
        partos: pRes.status === 'fulfilled' ? pRes.value.data || [] : [],
        mortalidad: mRes.status === 'fulfilled' ? mRes.value.data || [] : [],
        pesajes: [],
        usuarios: uRes.status === 'fulfilled' ? uRes.value.data || [] : [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const q = query.trim().toLowerCase();

  // Filtrado de Animales
  const resAnimales = (data.animales || []).filter((a) => {
    if (!q) return true;
    return (
      (a.codigo && a.codigo.toLowerCase().includes(q)) ||
      (a.raza && a.raza.toLowerCase().includes(q)) ||
      (a.categoria && a.categoria.toLowerCase().includes(q)) ||
      (a.sexo && (a.sexo.toLowerCase() === q || (q === 'macho' && a.sexo === 'M') || (q === 'hembra' && a.sexo === 'H'))) ||
      (a.jaula && a.jaula.toLowerCase().includes(q)) ||
      (a.area && a.area.toLowerCase().includes(q)) ||
      (a.particularidades && a.particularidades.toLowerCase().includes(q))
    );
  });

  // Filtrado de Jaulas & Áreas
  const resJaulas = (data.jaulas || []).filter((j) => {
    if (!q) return true;
    return (
      (j.codigo && j.codigo.toLowerCase().includes(q)) ||
      (j.area_nombre && j.area_nombre.toLowerCase().includes(q)) ||
      (j.nombre && j.nombre.toLowerCase().includes(q))
    );
  });

  const resAreas = (data.areas || []).filter((ar) => {
    if (!q) return true;
    return (
      (ar.nombre && ar.nombre.toLowerCase().includes(q)) ||
      (ar.proposito && ar.proposito.toLowerCase().includes(q))
    );
  });

  // Filtrado de Ventas
  const resVentas = (data.ventas || []).filter((v) => {
    if (!q) return true;
    return (
      (v.comprador && v.comprador.toLowerCase().includes(q)) ||
      (v.categoria && v.categoria.toLowerCase().includes(q)) ||
      (v.clasificacion && v.clasificacion.toLowerCase().includes(q)) ||
      (v.precio && v.precio.toString().includes(q)) ||
      (v.fecha && v.fecha.includes(q))
    );
  });

  // Filtrado de Eventos (Empadres, Partos, Mortalidad)
  const resEmpadres = (data.empadres || []).filter((e) => {
    if (!q) return true;
    return (
      (e.macho_codigo && e.macho_codigo.toLowerCase().includes(q)) ||
      (e.hembra_codigo && e.hembra_codigo.toLowerCase().includes(q)) ||
      (e.jaula_codigo && e.jaula_codigo.toLowerCase().includes(q)) ||
      (e.fecha_empadre && e.fecha_empadre.includes(q))
    );
  });

  const resPartos = (data.partos || []).filter((p) => {
    if (!q) return true;
    return (
      (p.madre_codigo && p.madre_codigo.toLowerCase().includes(q)) ||
      (p.padre_codigo && p.padre_codigo.toLowerCase().includes(q)) ||
      (p.fecha_nacimiento && p.fecha_nacimiento.includes(q))
    );
  });

  const resMortalidad = (data.mortalidad || []).filter((m) => {
    if (!q) return true;
    return (
      (m.animal_codigo && m.animal_codigo.toLowerCase().includes(q)) ||
      (m.categoria && m.categoria.toLowerCase().includes(q)) ||
      (m.causa && m.causa.toLowerCase().includes(q)) ||
      (m.fecha && m.fecha.includes(q))
    );
  });

  const totalEventosCount = resEmpadres.length + resPartos.length + resMortalidad.length;
  const totalResultados =
    resAnimales.length + resJaulas.length + resAreas.length + resVentas.length + totalEventosCount;

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
          Motor de Búsqueda Global
        </p>
        <h1 style={{ ...s.title, marginBottom: 6 }}>Búsqueda General del Sistema</h1>
        <p style={{ ...s.sub, marginBottom: 0 }}>
          Encuentra al instante cualquier registro: código de cuy, jaula, área, evento reproductivo, venta o usuario en toda la granja.
        </p>
      </div>

      {/* Barra de Búsqueda Principal */}
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
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.maroon,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por código de cuy (ej: U01, UM24), jaula, área, raza, comprador, fecha..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                ...s.input,
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.85rem',
                paddingBottom: '0.85rem',
                fontSize: '1.05rem',
                fontWeight: 500,
                borderRadius: theme.radius,
                border: `2px solid ${query ? theme.maroon : theme.border}`,
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
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
              }}
            >
              Limpiar búsqueda
            </button>
          )}
          <button
            onClick={fetchAll}
            style={{
              ...s.btnGhost,
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Recargar datos"
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Pestañas de filtrado */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.15rem' }}>
          {[
            { id: 'todos', label: 'Todos', count: totalResultados },
            { id: 'animales', label: 'Cuyes / Animales', count: resAnimales.length },
            { id: 'jaulas', label: 'Jaulas & Áreas', count: resJaulas.length + resAreas.length },
            { id: 'eventos', label: 'Eventos (Partos/Empadres/Bajas)', count: totalEventosCount },
            { id: 'ventas', label: 'Ventas (S/.)', count: resVentas.length },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  borderRadius: 20,
                  border: active ? `1.5px solid ${theme.maroon}` : `1px solid ${theme.border}`,
                  background: active ? theme.maroon : theme.creamSoft,
                  color: active ? '#FFFFFF' : theme.ink,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 10,
                    background: active ? 'rgba(255,255,255,0.25)' : theme.creamDeep,
                    color: active ? '#FFFFFF' : theme.maroonDeep,
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: theme.muted }}>
          <p>Buscando en todos los registros del criadero...</p>
        </div>
      )}

      {/* RESULTADOS: SECCIÓN ANIMALES */}
      {(activeTab === 'todos' || activeTab === 'animales') && resAnimales.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...s.title, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🐹</span> Cuyes / Fichas de Animales ({resAnimales.length})
            </h2>
            <Link to="/animales" style={{ color: theme.maroon, fontSize: '0.85rem', fontWeight: 700 }}>
              Ver todos en Animales →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {resAnimales.slice(0, activeTab === 'todos' ? 8 : 40).map((a) => (
              <div
                key={a.id}
                onClick={() => navigate('/animales')}
                style={{
                  ...s.card,
                  margin: 0,
                  cursor: 'pointer',
                  padding: '1rem 1.15rem',
                  border: `1.5px solid ${theme.border}`,
                  transition: 'transform 150ms ease, box-shadow 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = theme.maroon;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: theme.maroonDeep, fontFamily: theme.fontDisplay }}>
                      {a.codigo}
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 10,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: a.sexo === 'M' || a.sexo === 'macho' ? '#E3F2FD' : '#FCE4EC',
                        color: a.sexo === 'M' || a.sexo === 'macho' ? '#1565C0' : '#C2185B',
                      }}
                    >
                      {a.sexo === 'M' ? '♂ Macho' : a.sexo === 'H' ? '♀ Hembra' : a.sexo}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 10,
                      background: a.estado === 'activo' ? '#E8F5E9' : '#FFEBEE',
                      color: a.estado === 'activo' ? '#2E7D32' : '#C62828',
                      fontWeight: 700,
                    }}
                  >
                    {a.estado || 'activo'}
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: theme.muted, lineHeight: 1.4 }}>
                  <div><strong>Raza:</strong> {a.raza || '—'}</div>
                  <div><strong>Categoría:</strong> {a.categoria || '—'}</div>
                  <div><strong>Ubicación:</strong> Jaula {a.jaula || '—'} {a.area ? `(${a.area})` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTADOS: SECCIÓN JAULAS & ÁREAS */}
      {(activeTab === 'todos' || activeTab === 'jaulas') && (resJaulas.length > 0 || resAreas.length > 0) && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...s.title, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛖</span> Jaulas y Áreas ({resJaulas.length + resAreas.length})
            </h2>
            <Link to="/jaulas" style={{ color: theme.maroon, fontSize: '0.85rem', fontWeight: 700 }}>
              Ver Jaulas →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {resJaulas.slice(0, activeTab === 'todos' ? 6 : 30).map((j) => (
              <div
                key={j.id}
                onClick={() => navigate('/jaulas')}
                style={{
                  ...s.card,
                  margin: 0,
                  padding: '1rem 1.15rem',
                  cursor: 'pointer',
                  border: `1.5px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: theme.maroonDeep, fontSize: '1.05rem' }}>{j.codigo || j.nombre}</strong>
                  <span style={{ fontSize: '0.75rem', color: theme.muted }}>Jaula</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: theme.muted }}>
                  <div>Área: {j.area_nombre || j.area || '—'}</div>
                  <div>Capacidad: {j.capacidad_maxima ? `${j.ocupacion || 0} / ${j.capacidad_maxima} cuyes` : '—'}</div>
                </div>
              </div>
            ))}
            {resAreas.slice(0, activeTab === 'todos' ? 4 : 20).map((ar) => (
              <div
                key={ar.id}
                onClick={() => navigate('/areas')}
                style={{
                  ...s.card,
                  margin: 0,
                  padding: '1rem 1.15rem',
                  cursor: 'pointer',
                  border: `1.5px solid ${theme.border}`,
                  background: 'linear-gradient(145deg, #FFFCFA 0%, #F5EDE0 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: theme.maroonDeep, fontSize: '1.05rem' }}>{ar.nombre}</strong>
                  <span style={{ fontSize: '0.75rem', color: theme.maroon, fontWeight: 700 }}>Área</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: theme.muted }}>
                  <div>Propósito: {ar.proposito || '—'}</div>
                  <div>Jaulas asociadas: {ar.jaulas_count ?? (ar.jaulas?.length || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTADOS: SECCIÓN VENTAS */}
      {(activeTab === 'todos' || activeTab === 'ventas') && resVentas.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...s.title, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💰</span> Ventas Registradas ({resVentas.length})
            </h2>
            <Link to="/ventas" style={{ color: theme.maroon, fontSize: '0.85rem', fontWeight: 700 }}>
              Ver Módulo de Ventas →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {resVentas.slice(0, activeTab === 'todos' ? 6 : 30).map((v) => (
              <div
                key={v.id}
                onClick={() => navigate('/ventas')}
                style={{
                  ...s.card,
                  margin: 0,
                  padding: '1rem 1.15rem',
                  cursor: 'pointer',
                  border: `1.5px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: '#2E7D32', fontSize: '1.1rem' }}>
                    S/. {v.precio != null ? Number(v.precio).toFixed(2) : '0.00'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: theme.muted }}>{v.fecha}</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: theme.muted }}>
                  <div><strong>Comprador:</strong> {v.comprador || 'Público general'}</div>
                  <div><strong>Categoría:</strong> {v.categoria || '—'} ({v.cantidad || 1} unid.)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTADOS: SECCIÓN EVENTOS (Empadres, Partos, Bajas) */}
      {(activeTab === 'todos' || activeTab === 'eventos') && totalEventosCount > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...s.title, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Eventos Reproductivos y de Manejo ({totalEventosCount})
            </h2>
            <Link to="/eventos" style={{ color: theme.maroon, fontSize: '0.85rem', fontWeight: 700 }}>
              Ir a Eventos →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {resEmpadres.slice(0, 4).map((e) => (
              <div
                key={`emp-${e.id}`}
                onClick={() => navigate('/empadres')}
                style={{ ...s.card, margin: 0, padding: '1rem', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#7A1216', fontWeight: 700 }}>EMPADRE / MONTA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, margin: '4px 0', color: theme.ink }}>
                  Macho: {e.macho_codigo || '—'} · Fecha: {e.fecha_empadre || '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: theme.muted }}>
                  Jaula: {e.jaula_codigo || '—'} · Hembras: {e.total_hembras || 1}
                </div>
              </div>
            ))}
            {resPartos.slice(0, 4).map((p) => (
              <div
                key={`par-${p.id}`}
                onClick={() => navigate('/partos')}
                style={{ ...s.card, margin: 0, padding: '1rem', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#9C27B0', fontWeight: 700 }}>PARTO / CAMADA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, margin: '4px 0', color: theme.ink }}>
                  Madre: {p.madre_codigo || '—'} · Nacimiento: {p.fecha_nacimiento || '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: theme.muted }}>
                  Camada: {p.tamano_camada || 0} crías (Vivas: {p.crias_vivas || 0})
                </div>
              </div>
            ))}
            {resMortalidad.slice(0, 4).map((m) => (
              <div
                key={`mor-${m.id}`}
                onClick={() => navigate('/mortalidad')}
                style={{ ...s.card, margin: 0, padding: '1rem', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#C62828', fontWeight: 700 }}>MORTALIDAD / BAJA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, margin: '4px 0', color: theme.ink }}>
                  {m.animal_codigo ? `Animal ${m.animal_codigo}` : `Baja: ${m.categoria || 'Sin clasificar'}`}
                </div>
                <div style={{ fontSize: '0.82rem', color: theme.muted }}>
                  Fecha: {m.fecha || '—'} · Causa: {m.causa || 'No especificada'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalResultados === 0 && !loading && (
        <div
          style={{
            ...s.card,
            textAlign: 'center',
            padding: '3.5rem 2rem',
            color: theme.muted,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ color: theme.maroonDeep, margin: '0 0 0.5rem' }}>No se encontraron coincidencias</h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
            No se encontró ningún registro para &ldquo;{query}&rdquo;. Puedes probar buscando por código de animal (ej: <code>U01</code>), jaula, fecha o área.
          </p>
          <button type="button" onClick={() => setQuery('')} style={s.btn}>
            Limpiar búsqueda y ver todo
          </button>
        </div>
      )}
    </div>
  );
};

export default BusquedaGlobal;
