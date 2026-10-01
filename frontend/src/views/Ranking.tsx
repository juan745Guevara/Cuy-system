'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { page as s } from '@/lib/ui';
import { useAuth } from '../context/AuthContext';

/** Ranking de reproductores · ponderación de indicadores · descarte/reemplazo */
const Ranking = () => {
  const { user } = useAuth();
  const admin = user?.rol === 'superadmin' || user?.rol === 'admin' || user?.rol === 'supervisor';
  const [sexo, setSexo] = useState('H');
  const [ranking, setRanking] = useState([]);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.get('/cuyes/ranking', { params: { sexo } }),
        api.get('/cuyes/ranking/config'),
      ]);
      setRanking(r.data.ranking || []);
      setConfig(r.data.config || c.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar ranking');
    }
  }, [sexo]);

  useEffect(() => {
    load();
  }, [load]);

  const guardarConfig = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.put('/cuyes/ranking/config', config);
      setConfig(data);
      setOk('Ponderación guardada');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  };

  const mark = async (id, accion) => {
    try {
      await api.post(`/cuyes/ranking/${id}/mark`, { accion });
      setOk(`Marcado como ${accion}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo mark');
    }
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Ranking de reproductores</h1>
      <p style={s.sub}>Desempeño para decisiones de descarte o reemplazo</p>
      {error && <div style={s.error}>{error}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <div style={s.row}>
        <button
          type="button"
          style={sexo === 'H' ? s.btn : s.btnGhost}
          onClick={() => setSexo('H')}
        >
          Hembras
        </button>
        <button
          type="button"
          style={sexo === 'M' ? s.btn : s.btnGhost}
          onClick={() => setSexo('M')}
        >
          Machos
        </button>
      </div>

      {admin && config && (
        <form onSubmit={guardarConfig} style={s.card}>
          <h3 style={{ marginTop: 0 }}>Ponderación</h3>
          <div style={s.row}>
            {[
              'peso_partos',
              'peso_camada',
              'peso_destete',
              'peso_mortalidad',
              'peso_peso_nac',
              'peso_prenez_macho',
            ].map((k) => (
              <label key={k} style={{ fontSize: '0.85rem' }}>
                {k.replace('peso_', '')}
                <br />
                <input
                  style={s.input}
                  type="number"
                  value={config[k] ?? ''}
                  onChange={(e) => setConfig({ ...config, [k]: Number(e.target.value) })}
                />
              </label>
            ))}
            <button type="submit" style={s.btn}>
              Guardar
            </button>
          </div>
        </form>
      )}

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>#</th>
            <th style={s.th}>Código</th>
            <th style={s.th}>Raza</th>
            <th style={s.th}>Puntaje</th>
            <th style={s.th}>Indicadores</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.id}>
              <td style={s.td}>{i + 1}</td>
              <td style={s.td}>{r.codigo}</td>
              <td style={s.td}>{r.raza || '—'}</td>
              <td style={s.td}>
                {r.datos_insuficientes ? 'datos insuficientes' : r.puntaje}
              </td>
              <td style={s.td}>
                {sexo === 'H'
                  ? `partos ${r.partos} · camada ${r.camada_promedio} · destete ${r.destete_promedio}`
                  : `empadres ${r.empadres} · preñez ${r.pct_prenez}% · camada ${r.camada_promedio}`}
              </td>
              <td style={s.td}>
                <button type="button" style={s.btnGhost} onClick={() => mark(r.id, 'reemplazo')}>
                  Reemplazo
                </button>{' '}
                <button type="button" style={s.btnDanger} onClick={() => mark(r.id, 'descarte')}>
                  Descarte
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ranking;
