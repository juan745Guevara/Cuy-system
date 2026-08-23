import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { page as s } from '../styles/ui';

/** CUY-01 razas · CUY-02 categorías */
const Catalogos = () => {
  const [razas, setRazas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [razaNombre, setRazaNombre] = useState('');
  const [catNombre, setCatNombre] = useState('');
  const [proposito, setProposito] = useState('empadre');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.get('/catalogos/razas'),
        api.get('/catalogos/categorias'),
      ]);
      setRazas(r.data);
      setCategorias(c.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar catálogos');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addRaza = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/catalogos/razas', { nombre: razaNombre });
      setOk('Raza agregada');
      setRazaNombre('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear raza');
    }
  };

  const addCat = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/catalogos/categorias', {
        nombre: catNombre,
        proposito_area: proposito,
      });
      setOk('Categoría agregada');
      setCatNombre('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear categoría');
    }
  };

  const desactivarRaza = async (id, nombre) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/catalogos/razas/${id}/desactivar`);
      setOk(`Raza "${nombre}" desactivada`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo desactivar raza');
    }
  };

  const desactivarCategoria = async (id, nombre) => {
    setError('');
    setOk('');
    try {
      await api.patch(`/catalogos/categorias/${id}/desactivar`);
      setOk(`Categoría "${nombre}" desactivada`);
      load();
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Endpoint de desactivar categoría no disponible aún');
      } else {
        setError(err.response?.data?.error || 'No se pudo desactivar categoría');
      }
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Catálogos del módulo cuyes</h1>
      <p style={s.sub}>Razas/líneas y categorías productivas</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Razas</h3>
          <form onSubmit={addRaza} style={s.row}>
            <input
              style={s.input}
              required
              placeholder="Nueva raza"
              value={razaNombre}
              onChange={(e) => setRazaNombre(e.target.value)}
            />
            <button type="submit" style={s.btn}>
              Agregar
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {razas.map((r) => (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.35rem 0',
                  borderBottom: '1px solid #E0D3BF',
                }}
              >
                <span>{r.nombre}</span>
                <button type="button" style={s.btnDanger} onClick={() => desactivarRaza(r.id, r.nombre)}>
                  Desactivar
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Categorías</h3>
          <form onSubmit={addCat} style={s.row}>
            <input
              style={s.input}
              required
              placeholder="Nueva categoría"
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
            />
            <select style={s.select} value={proposito} onChange={(e) => setProposito(e.target.value)}>
              <option value="empadre">Empadre</option>
              <option value="gestacion_maternidad">Gestación / maternidad</option>
              <option value="recria_hembras">Recría hembras</option>
              <option value="recria_machos">Recría machos</option>
              <option value="reproductores_machos">Reproductores machos</option>
              <option value="engorde_descarte">Engorde / descarte</option>
              <option value="cuarentena">Cuarentena</option>
            </select>
            <button type="submit" style={s.btn}>
              Agregar
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {categorias.map((c) => (
              <li
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.35rem 0',
                  borderBottom: '1px solid #E0D3BF',
                }}
              >
                <span>
                  {c.nombre} {c.proposito_area ? `(${c.proposito_area})` : ''}
                </span>
                <button
                  type="button"
                  style={s.btnDanger}
                  onClick={() => desactivarCategoria(c.id, c.nombre)}
                >
                  Desactivar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Catalogos;
