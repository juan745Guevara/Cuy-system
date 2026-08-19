import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Panel de la granja - NUC-03</p>
      
      {/* TODO: Implementar dashboard - NUC-03 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Población Total</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
          <p>Animales registrados</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Nacimientos del Mes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
          <p>Cuys nacidos</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Alertas Pendientes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
          <p>Tareas pendientes</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
