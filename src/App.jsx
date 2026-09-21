import { useState, useEffect } from 'react';

export default function App() {
  const fechaHoy = new Date().toISOString().split('T')[0];
  
  const [vistaActiva, setVistaActiva] = useState('venta'); 
  const [inventario, setInventario] = useState({});
  const [carrito, setCarrito] = useState({});
  const [encargos, setEncargos] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // NUEVO: Estado para ver si la PC responde
  const [estadoSync, setEstadoSync] = useState('Esperando conexión...'); 
  
  const [catalogo, setCatalogo] = useState({
    Concha: 8, Quesadilla: 15, Elote: 8, Cuernito: 8, Bisquet: 8
  });

  const [ventasDia, setVentasDia] = useState({ totalDinero: 0, piezas: {} });

  const [panEditando, setPanEditando] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formPrecio, setFormPrecio] = useState(8); 

  useEffect(() => {
    const invGuardado = localStorage.getItem(`inventario_${fechaHoy}`);
    if (invGuardado) setInventario(JSON.parse(invGuardado));
    const catGuardado = localStorage.getItem('catalogo_panes');
    if (catGuardado) setCatalogo(JSON.parse(catGuardado));
    const ventasGuardadas = localStorage.getItem(`ventas_${fechaHoy}`);
    if (ventasGuardadas) setVentasDia(JSON.parse(ventasGuardadas));
    const encargosGuardados = localStorage.getItem('encargos_pendientes');
    if (encargosGuardados) setEncargos(JSON.parse(encargosGuardados));
    const historialGuardado = localStorage.getItem('historial_ventas');
    if (historialGuardado) setHistorialVentas(JSON.parse(historialGuardado));

    const handleOnline = () => { setIsOnline(true); sincronizarConServidor(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [fechaHoy]);

  // =========================================================================
  // 🚀 LA FUNCIÓN MAESTRA: Lee la memoria del celular y manda TODO a la PC
  // =========================================================================
  const sincronizarConServidor = async () => {
    if (!isOnline) return;
    setEstadoSync('Sincronizando...');
    const URL_SERVIDOR = "http://192.168.1.116:8000"; 
    
    try {
      // Leemos directo de la memoria del celular para enviar el dato exacto
      const payload = {
        fecha_sincronizacion: new Date().toLocaleString(),
        ventasDelDia: JSON.parse(localStorage.getItem(`ventas_${fechaHoy}`)) || { totalDinero: 0, piezas: {} },
        inventarioActual: JSON.parse(localStorage.getItem(`inventario_${fechaHoy}`)) || {},
        encargosPendientes: JSON.parse(localStorage.getItem('encargos_pendientes')) || [],
        historial: JSON.parse(localStorage.getItem('historial_ventas')) || [],
        catalogo: JSON.parse(localStorage.getItem('catalogo_panes')) || {}
      };

      const respuesta = await fetch(`${URL_SERVIDOR}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        setEstadoSync('✅ PC Actualizada correctamente');
      } else {
        setEstadoSync('❌ Error al guardar en la PC');
      }
    } catch (error) {
      console.error(error);
      setEstadoSync('❌ PC no responde (Revisa el Firewall de Kali)');
    }
  };

  // =========================================================================
  // FUNCIONES DE GUARDADO (Todas disparan la sincronización ahora)
  // =========================================================================
  const guardarInventario = (nuevo) => {
    setInventario(nuevo);
    localStorage.setItem(`inventario_${fechaHoy}`, JSON.stringify(nuevo));
    setTimeout(sincronizarConServidor, 100); 
  };

  const guardarVentas = (nuevasVentas) => {
    setVentasDia(nuevasVentas);
    localStorage.setItem(`ventas_${fechaHoy}`, JSON.stringify(nuevasVentas));
    setTimeout(sincronizarConServidor, 100); 
  };

  const guardarCatalogo = (nuevoCat) => {
    setCatalogo(nuevoCat);
    localStorage.setItem('catalogo_panes', JSON.stringify(nuevoCat));
    setTimeout(sincronizarConServidor, 100); 
  };

  const guardarEncargos = (nuevosEncargos) => {
    setEncargos(nuevosEncargos);
    localStorage.setItem('encargos_pendientes', JSON.stringify(nuevosEncargos));
    setTimeout(sincronizarConServidor, 100); 
  };

  // =========================================================================
  // LÓGICA DE VENTA
  // =========================================================================
  const cobrar = () => {
    if (Object.keys(carrito).length === 0) return;
    const nuevoInventario = { ...inventario };
    const nuevasVentas = { ...ventasDia, piezas: { ...ventasDia.piezas } };
    let dineroSumado = 0;
    for (const pan in carrito) {
      nuevoInventario[pan] -= carrito[pan];
      nuevasVentas.piezas[pan] = (nuevasVentas.piezas[pan] || 0) + carrito[pan];
      dineroSumado += carrito[pan] * catalogo[pan];
    }
    nuevasVentas.totalDinero += dineroSumado;
    
    // Al llamar a estas funciones, se dispara la sincronización automáticamente
    guardarInventario(nuevoInventario);
    guardarVentas(nuevasVentas);
    setCarrito({});
  };

  const quitarDelCarrito = (pan) => {
    const nuevoCarrito = { ...carrito };
    if (nuevoCarrito[pan] > 1) nuevoCarrito[pan] -= 1;
    else delete nuevoCarrito[pan];
    setCarrito(nuevoCarrito);
  };

  const cerrarDia = () => {
    if (window.confirm('¿Cerrar el día?')) {
      if (ventasDia.totalDinero > 0) {
        const nuevoHistorial = [{ fecha: new Date().toLocaleDateString(), fechaISO: fechaHoy, datos: ventasDia }, ...historialVentas];
        setHistorialVentas(nuevoHistorial);
        localStorage.setItem('historial_ventas', JSON.stringify(nuevoHistorial));
      }
      guardarInventario({});
      guardarVentas({ totalDinero: 0, piezas: {} });
    }
  };

  const borrarHistorialPruebas = () => {
    if (window.confirm('🚨 ¿Borrar TODO el historial de ventas? Solo haz esto si terminaste de probar.')) {
      setHistorialVentas([]);
      localStorage.removeItem('historial_ventas');
      setTimeout(sincronizarConServidor, 100); 
    }
  };

  // =========================================================================
  // CATÁLOGO Y ENCARGOS
  // =========================================================================
  const guardarEdicionCatalogo = (e) => {
    e.preventDefault();
    const nuevoCat = { ...catalogo };
    if (panEditando && panEditando !== formNombre.trim()) delete nuevoCat[panEditando];
    nuevoCat[formNombre.trim()] = parseFloat(formPrecio); 
    guardarCatalogo(nuevoCat);
    setPanEditando(''); setFormNombre(''); setFormPrecio(8);
  };

  const agregarEncargo = (e) => {
    e.preventDefault();
    guardarEncargos([...encargos, { id: Date.now(), cliente: e.target.cliente.value, pedido: e.target.pedido.value }]);
    e.target.reset();
  };

  const tabStyle = (activa) => ({
    flex: 1, padding: '12px 5px', fontSize: '15px', border: 'none',
    background: activa ? '#333' : '#ddd', color: activa ? 'white' : 'black',
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* MENÚ SUPERIOR */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', background: '#222' }}>
        <button style={tabStyle(vistaActiva === 'venta')} onClick={() => setVistaActiva('venta')}>🛒 Venta</button>
        <button style={tabStyle(vistaActiva === 'carga')} onClick={() => setVistaActiva('carga')}>📦 Carga</button>
        <button style={tabStyle(vistaActiva === 'encargos')} onClick={() => setVistaActiva('encargos')}>📝 Encargos</button>
        <button style={tabStyle(vistaActiva === 'admin')} onClick={() => setVistaActiva('admin')}>⚙️ Admin</button>
        <div style={{ padding: '0 10px', color: isOnline ? '#4CAF50' : '#F44336', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        
        {/* ================= VISTA 1: PUNTO DE VENTA ================= */}
        {vistaActiva === 'venta' && (
          <div>
            <h2>Despachar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {Object.keys(inventario).map((pan) => {
                const disponibles = inventario[pan] - (carrito[pan] || 0);
                if (inventario[pan] <= 0) return null; 
                return (
                  <button key={pan} onClick={() => disponibles > 0 && setCarrito({ ...carrito, [pan]: (carrito[pan] || 0) + 1 })} disabled={disponibles === 0} style={{ padding: '15px 5px', fontSize: '16px', borderRadius: '8px', border: 'none', background: disponibles > 0 ? '#4CAF50' : '#ccc', color: 'white' }}>
                    <strong>{pan} (${catalogo[pan]})</strong><br/><small>Quedan: {disponibles}</small>
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Cuenta: <span style={{ color: 'green' }}>${Object.keys(carrito).reduce((s, p) => s + (carrito[p] * catalogo[p]), 0)}</span></h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {Object.keys(carrito).map(pan => (
                  <li key={pan} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                    <span>{carrito[pan]}x {pan}</span>
                    <button onClick={() => quitarDelCarrito(pan)} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>-1</button>
                  </li>
                ))}
              </ul>
              {Object.keys(carrito).length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={cobrar} style={{ flex: 1, padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px' }}>Cobrar</button>
                  <button onClick={() => setCarrito({})} style={{ padding: '15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px' }}>X</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VISTA 2: INVENTARIO ================= */}
        {vistaActiva === 'carga' && (
           <div>
           <h2>Subir a Camioneta</h2>
           <form onSubmit={(e) => {
             e.preventDefault();
             guardarInventario({ ...inventario, [e.target.pan.value]: (inventario[e.target.pan.value] || 0) + parseInt(e.target.cantidad.value) });
             e.target.cantidad.value = '';
           }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
             <select name="pan" style={{ flex: 1, padding: '10px', fontSize: '16px' }}>
               {Object.keys(catalogo).map(pan => <option key={pan} value={pan}>{pan}</option>)}
             </select>
             <input name="cantidad" type="number" placeholder="Pz" style={{ width: '80px', padding: '10px' }} required />
             <button type="submit" style={{ padding: '10px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px' }}>+</button>
           </form>
           <ul style={{ listStyle: 'none', padding: 0 }}>
             {Object.keys(inventario).map((pan) => (
               <li key={pan} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#eee', margin: '5px 0', borderRadius: '5px' }}>
                 <span>{pan}</span>
                 <input type="number" value={inventario[pan]} onBlur={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const inv = { ...inventario, [pan]: val };
                    if (val <= 0) delete inv[pan]; 
                    guardarInventario(inv);
                 }} onChange={(e) => setInventario({...inventario, [pan]: e.target.value})} style={{ width: '60px', textAlign: 'center', padding: '5px' }} />
               </li>
             ))}
           </ul>
         </div>
        )}

        {/* ================= VISTA 3: ENCARGOS ================= */}
        {vistaActiva === 'encargos' && (
          <div>
            <h2>Encargos Especiales</h2>
            <form onSubmit={agregarEncargo} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
              <input name="cliente" placeholder="Cliente/Tienda" style={{ padding: '10px' }} required />
              <input name="pedido" placeholder="¿Qué encargó?" style={{ padding: '10px' }} required />
              <button type="submit" style={{ padding: '10px', background: '#0288d1', color: 'white', border: 'none', borderRadius: '5px' }}>Guardar Encargo</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {encargos.map((enc) => (
                <li key={enc.id} style={{ background: '#fff', border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                  <strong>{enc.cliente}</strong><p>{enc.pedido}</p>
                  <button onClick={() => guardarEncargos(encargos.filter(e => e.id !== enc.id))} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 15px', width: '100%', borderRadius: '5px' }}>✔ Entregado</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ================= VISTA 4: ADMINISTRACIÓN ================= */}
        {vistaActiva === 'admin' && (
          <div>
            
            {/* PANEL DE CONEXIÓN */}
            <div style={{ background: '#e1f5fe', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Estado de Conexión a PC</h3>
              <p style={{ fontWeight: 'bold', margin: '0 0 10px 0', color: estadoSync.includes('✅') ? 'green' : (estadoSync.includes('❌') ? 'red' : 'black') }}>
                {estadoSync}
              </p>
              <button onClick={sincronizarConServidor} style={{ padding: '10px 20px', background: '#0288d1', color: 'white', border: 'none', borderRadius: '5px', width: '100%' }}>
                🔄 Forzar Sincronización
              </button>
            </div>

            <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: 'green', margin: '5px 0' }}>Venta Total: ${ventasDia.totalDinero}</h3>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {Object.keys(ventasDia.piezas).map(pan => <li key={pan}>{pan}: {ventasDia.piezas[pan]} vendidas</li>)}
              </ul>
              <button onClick={cerrarDia} style={{ width: '100%', padding: '15px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '8px' }}>🛑 Cerrar Día</button>
            </div>

            {/* HISTORIAL DE VENTAS */}
            <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h2>Historial de Ventas</h2>
              {historialVentas.length === 0 ? (
                <p style={{ color: '#666' }}>No hay ventas anteriores.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {historialVentas.map((dia, index) => (
                    <li key={index} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                      <strong>{dia.fecha}</strong> - Total: <span style={{ color: 'green' }}>${dia.datos.totalDinero}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={borrarHistorialPruebas} style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#888', color: 'white', border: 'none', borderRadius: '5px' }}>
                🗑️ Borrar Historial de Pruebas
              </button>
            </div>

            <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px' }}>
              <h2>{panEditando ? `Editando: ${panEditando}` : 'Catálogo'}</h2>
              <form onSubmit={guardarEdicionCatalogo} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre" style={{ flex: 1, padding: '10px' }} required />
                <input value={formPrecio} onChange={(e) => setFormPrecio(e.target.value)} type="number" step="0.5" style={{ width: '70px', padding: '10px' }} required />
                <button type="submit" style={{ padding: '10px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '5px' }}>{panEditando ? '✔' : '+'}</button>
              </form>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {Object.keys(catalogo).map(pan => (
                  <li key={pan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #ccc' }}>
                    <span><strong>{pan}</strong>: ${catalogo[pan]}</span>
                    <button onClick={() => { setPanEditando(pan); setFormNombre(pan); setFormPrecio(catalogo[pan]); }} style={{ background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>Editar</button>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}