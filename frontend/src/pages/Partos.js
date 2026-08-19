import React from 'react';

const Partos = () => {
  return (
    <div>
      <h1>Partos y Destetes</h1>
      <p>Gestión reproductiva - CUY-07, CUY-08, CUY-09</p>
      
      {/* TODO: Implementar registro de partos */}
      <div style={{ marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', marginRight: '10px' }}>
          + Registrar Parto (CUY-08)
        </button>
        <button style={{ padding: '10px 20px' }}>
          + Registrar Destete (CUY-09)
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Últimos Partos</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Hembra</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Camada</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Peso Prom.</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay partos registrados. Implementar CUY-08.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Partos;
