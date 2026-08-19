import React from 'react';

const Animales = () => {
  return (
    <div>
      <h1>Animales</h1>
      <p>Gestión de animales - NUC-09, NUC-10, NUC-11, NUC-12</p>
      
      {/* TODO: Implementar listado de animales */}
      <div style={{ marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', marginRight: '10px' }}>
          + Registrar Animal (NUC-09)
        </button>
        <input 
          type="text" 
          placeholder="Buscar por código (NUC-11)..." 
          style={{ padding: '10px', width: '300px' }}
        />
      </div>

      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Sexo</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Raza</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Jaula</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No hay animales registrados. Implementar NUC-09.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Animales;
