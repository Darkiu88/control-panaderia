import { useState } from 'react';

export default function CargaInventario({ inventario, guardarInventario }) {
  const [panSeleccionado, setPanSeleccionado] = useState('Concha');
  const [cantidad, setCantidad] = useState(0);

  const registrarCarga = (e) => {
    e.preventDefault();
    if (cantidad <= 0) return;

    const nuevoInventario = { ...inventario };
    nuevoInventario[panSeleccionado] = (nuevoInventario[panSeleccionado] || 0) + parseInt(cantidad);
    
    guardarInventario(nuevoInventario);
    setCantidad(0);
  };

  const limpiarCarga = () => {
    if(window.confirm('¿Seguro que quieres borrar la carga de hoy?')) {
      guardarInventario({});
    }
  };

  return (
    <div style={{ padding: '15px' }}>
      <h2>Registrar Charolas</h2>
      
      <form onSubmit={registrarCarga} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select 
          value={panSeleccionado} 
          onChange={(e) => setPanSeleccionado(e.target.value)}
          style={{ padding: '10px', fontSize: '18px', flex: 1 }}
        >
          <option value="Concha">Concha</option>
          <option value="Quesadilla">Quesadilla</option>
          <option value="Bolillo">Bolillo</option>
          <option value="Dona">Dona</option>
          <option value="Cuernito">Cuernito</option>
        </select>

        <input 
          type="number" 
          value={cantidad} 
          onChange={(e) => setCantidad(e.target.value)} 
          style={{ padding: '10px', fontSize: '18px', width: '70px' }}
        />

        <button type="submit" style={{ padding: '10px', fontSize: '18px', background: '#0066cc', color: 'white', border: 'none' }}>
          +
        </button>
      </form>

      <h3>En Camioneta:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.keys(inventario).map((pan) => (
          <li key={pan} style={{ fontSize: '20px', margin: '10px 0', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
            <strong>{pan}:</strong> {inventario[pan]} piezas
          </li>
        ))}
      </ul>
      
      {Object.keys(inventario).length > 0 && (
        <button 
          onClick={limpiarCarga}
          style={{ marginTop: '20px', padding: '10px', background: '#cc0000', color: 'white', border: 'none', borderRadius: '5px', width: '100%' }}
        >
          Limpiar Todo
        </button>
      )}
    </div>
  );
}