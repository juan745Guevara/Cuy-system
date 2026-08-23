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
          <ul>
            {razas.map((r) => (
              <li key={r.id}>{r.nombre}</li>
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
              <option value="maternidad">Maternidad</option>
              <option value="recria">Recría</option>
              <option value="machos">Machos</option>
              <option value="engorde">Engorde</option>
            </select>
            <button type="submit" style={s.btn}>
              Agregar
            </button>
          </form>
          <ul>
            {categorias.map((c) => (
              <li key={c.id}>
                {c.nombre} {c.proposito_area ? `(${c.proposito_area})` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Catalogos;
