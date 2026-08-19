import React from 'react';

const Inventario = () => {
  return (
    <div>
      <h1>Inventario</h1>
      <p>Población y movimientos - NUC-26, NUC-27, NUC-28, NUC-29</p>
      
      {/* TODO: Implementar inventario */}
      <div style={{ marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', marginRight: '10px' }}>
          + Registrar Mortalidad (NUC-26)
        </button>
        <button style={{ padding: '10px 20px', marginRight: '10px' }}>
          + Registrar Venta (NUC-27)
        </button>
        <button style={{ padding: '10px 20px' }}>
          Exportar Excel (NUC-36)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '30px' }}>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Población Actual (NUC-28)</h3>
          <p style={{ color: '#666' }}>Implementar consulta de población</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Resumen Mensual (NUC-29)</h3>
          <p style={{ color: '#666' }}>Implementar resumen mensual</p>
        </div>
      </div>
    </div>
  );
};

export default Inventario;
