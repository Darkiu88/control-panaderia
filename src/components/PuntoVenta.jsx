import { useState } from 'react';

export default function PuntoVenta({ inventario, guardarInventario, precios }) {
  const [carrito, setCarrito] = useState({});

  const agregarAlCarrito = (pan) => {
    const disponibles = inventario[pan] - (carrito[pan] || 0);
    if (disponibles > 0) {
      setCarrito({ ...carrito, [pan]: (carrito[pan] || 0) + 1 });
    }
  };

  const cobrar = () => {
    if (Object.keys(carrito).length === 0) return;
    
    // Descontamos definitivamente del inventario
    const nuevoInventario = { ...inventario };
    for (const pan in carrito) {
      nuevoInventario[pan] -= carrito[pan];
    }
    
    guardarInventario(nuevoInventario); // Actualiza el celular
    setCarrito({}); // Limpia la calculadora para el siguiente cliente
  };

  const cancelar = () => setCarrito({});

  // CALCULADORA: Suma el total en pesos
  const totalPesos = Object.keys(carrito).reduce((suma, pan) => {
    return suma + (carrito[pan] * precios[pan]);
  }, 0);

  return (
    <div style={{ padding: '10px' }}>
      <h2 style={{ margin: '0 0 15px 0' }}>Calculadora de Venta</h2>

      {/* BOTONERA DE PANES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {Object.keys(inventario).map((pan) => {
          const disponibles = inventario[pan] - (carrito[pan] || 0);
          return (
            <button 
              key={pan} 
              onClick={() => agregarAlCarrito(pan)}
              disabled={disponibles === 0}
              style={{ 
                padding: '15px 10px', fontSize: '18px', borderRadius: '8px', border: 'none',
                background: disponibles > 0 ? '#4CAF50' : '#ccc', color: 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}
            >
              <strong>{pan} (${precios[pan]})</strong>
              <span style={{ fontSize: '14px', marginTop: '5px' }}>Quedan: {disponibles}</span>
            </button>
          );
        })}
      </div>

      {/* TICKET / CUENTA */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <h3>Cuenta: <span style={{ color: 'green', fontSize: '24px' }}>${totalPesos}</span></h3>
        
        <ul style={{ paddingLeft: '20px', fontSize: '18px' }}>
          {Object.keys(carrito).map((pan) => (
            <li key={pan}>
              {carrito[pan]}x {pan} = ${carrito[pan] * precios[pan]}
            </li>
          ))}
        </ul>

        {totalPesos > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={cobrar} style={{ flex: 1, padding: '15px', background: '#007bff', color: 'white', fontSize: '20px', border: 'none', borderRadius: '8px' }}>
              Cobrar Venta
            </button>
            <button onClick={cancelar} style={{ padding: '15px', background: '#dc3545', color: 'white', fontSize: '20px', border: 'none', borderRadius: '8px' }}>
              X
            </button>
          </div>
        )}
      </div>
    </div>
  );
}