import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from './api';

// ─── MODAL FORMULARIO GENÉRICO (SOPORTE CREAR Y EDITAR) ────────────────────
const ModalFormulario = ({ tipo, item, onClose, onGuardado }) => {
  const campos = {
    clientes:  ['ci', 'nombre', 'telefono', 'comentario'],
    buses:     ['placa', 'modelo', 'capacidad_asientos'],
    choferes:  ['ci', 'nombre', 'telefono', 'edad', 'licencia'],
    viajes:    ['id_viaje', 'fecha', 'hora', 'id_ruta', 'placa'],
  };

  const isEdit = !!item;
  const [form, setForm] = useState(item ? { ...item } : {});
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    if (tipo === 'viajes') {
      // Cargar rutas y buses para dropdowns en el formulario de viajes
      api.get('rutas/').then(res => setRutas(res.data)).catch(console.error);
      api.get('flotas/').then(res => setBuses(res.data)).catch(console.error);
    }
  }, [tipo]);

  const getPK = (t, o) => ({ clientes: o.ci, buses: o.placa, choferes: o.ci, viajes: o.id_viaje }[t]);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const pk = getPK(tipo, item);
        const endpoint = { 
          clientes: `clientes/${pk}/`, 
          buses: `flotas/${pk}/`, 
          choferes: `choferes/${pk}/`, 
          viajes: `viajes-admin/${pk}/` 
        }[tipo];
        await api.put(endpoint, form);
      } else {
        const endpoint = { 
          clientes: 'clientes/', 
          buses: 'flotas/', 
          choferes: 'choferes/', 
          viajes: 'viajes-admin/' 
        }[tipo];
        await api.post(endpoint, form);
      }
      alert('✅ Guardado correctamente');
      onGuardado(); 
      onClose();
    } catch (err) { 
      alert(err.response?.data?.mensaje || 'Error al guardar el registro. Verifica los datos.'); 
    }
  };

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <h3 style={{ color: '#502bc0', marginBottom: 16, fontSize: '18px', fontWeight: 'bold' }}>
          {isEdit ? '✏️ Editar' : '➕ Nuevo'} {tipo.toUpperCase()}
        </h3>
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campos[tipo]?.map(k => {
            // Caso especial: deshabilitar la PK en edición
            const isPK = (tipo === 'clientes' && k === 'ci') || 
                         (tipo === 'buses' && k === 'placa') || 
                         (tipo === 'choferes' && k === 'ci') ||
                         (tipo === 'viajes' && k === 'id_viaje');

            // Dropdown de Rutas para Viajes
            if (tipo === 'viajes' && k === 'id_ruta') {
              return (
                <div key={k}>
                  <label style={ms.label}>RUTA</label>
                  <select 
                    style={ms.input}
                    value={form[k] || ''}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Ruta...</option>
                    {rutas.map(r => (
                      <option key={r.id_ruta} value={r.id_ruta}>
                        {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            // Dropdown de Buses para Viajes
            if (tipo === 'viajes' && k === 'placa') {
              return (
                <div key={k}>
                  <label style={ms.label}>BUS (PLACA)</label>
                  <select 
                    style={ms.input}
                    value={form[k] || ''}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Bus...</option>
                    {buses.map(b => (
                      <option key={b.placa} value={b.placa}>
                        {b.placa} - {b.modelo} (Capacidad: {b.capacidad_asientos})
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={k}>
                <label style={ms.label}>{k.replace('_', ' ').toUpperCase()}</label>
                <input 
                  style={{ ...ms.input, ...(isPK && isEdit ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}) }} 
                  value={form[k] || ''} 
                  type={k === 'fecha' ? 'date' : k === 'hora' ? 'time' : k === 'capacidad_asientos' || k === 'edad' ? 'number' : 'text'}
                  onChange={e => setForm({ ...form, [k]: e.target.value })} 
                  disabled={isPK && isEdit}
                  required={k !== 'comentario'}
                  placeholder={`Ingresa ${k.replace('_', ' ')}`}
                />
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" style={ms.btnGuardar}>Guardar</button>
            <button type="button" onClick={onClose} style={ms.btnCancelar}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ms = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', padding: 28, borderRadius: 12, width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  label:      { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 'bold' },
  input:      { width: '100%', padding: '9px 11px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  btnGuardar: { flex: 1, padding: '11px', background: '#502bc0', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  btnCancelar:{ flex: 1, padding: '11px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer' },
};

// ─── MÓDULO DINÁMICO (CLIENTES, BUSES, CHOFERES, VIAJES) ───────────────────
const ModuloDinamico = ({ tipo }) => {
  const { tienePermiso } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const config = {
    clientes: { endpoint: 'clientes', campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Teléfono', comentario: 'Comentario' } },
    buses:    { endpoint: 'flotas',       campos: { placa: 'Placa', modelo: 'Modelo', capacidad_asientos: 'Asientos' } },
    choferes: { endpoint: 'choferes',     campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Celular', edad: 'Edad', licencia: 'Licencia' } },
    viajes:   { endpoint: 'viajes-admin', campos: { id_viaje: 'ID Viaje', fecha: 'Fecha', hora: 'Hora', placa: 'Bus' } },
  };
  const conf = config[tipo];

  const cargar = useCallback(async () => {
    if (!conf) return;
    try { 
      const res = await api.get(`${conf.endpoint}/`); 
      setTodos(res.data); 
      setFiltrados(res.data); 
    } catch { 
      console.error('Error cargando módulo'); 
    }
  }, [conf]);

  useEffect(() => { cargar(); setBusqueda(''); }, [tipo, cargar]);
  
  useEffect(() => {
    if (!busqueda.trim()) { setFiltrados(todos); return; }
    const q = busqueda.toLowerCase();
    setFiltrados(todos.filter(item => 
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    ));
  }, [busqueda, todos]);

  const eliminar = async (item) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de forma permanente?')) return;
    try {
      const pk = { clientes: item.ci, buses: item.placa, choferes: item.ci, viajes: item.id_viaje }[tipo];
      const endpoint = { clientes: `clientes/${pk}/`, buses: `flotas/${pk}/`, choferes: `choferes/${pk}/`, viajes: `viajes-admin/${pk}/` }[tipo];
      await api.delete(endpoint); 
      cargar();
    } catch { 
      alert('Error al eliminar. Puede estar relacionado con otras tablas.'); 
    }
  };

  const puedeEditar = tienePermiso(tipo, 'modificar');
  const puedeEliminar = tienePermiso(tipo, 'eliminar');
  const puedeCrear = tienePermiso(tipo, 'crear');

  return (
    <div>
      {mostrarModal && (
        <ModalFormulario 
          tipo={tipo} 
          item={seleccionado} 
          onClose={() => { setMostrarModal(false); setSeleccionado(null); }} 
          onGuardado={cargar} 
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ textTransform: 'capitalize', color: '#502bc0', margin: 0, fontWeight: 'bold' }}>📂 {tipo}</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            placeholder={`🔍 Buscar en ${tipo}...`} 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: 220 }} 
          />
          {puedeCrear && (
            <button 
              style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => { setSeleccionado(null); setMostrarModal(true); }}
            >
              ➕ Nuevo
            </button>
          )}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.tabla}>
          <thead>
            <tr>
              {conf && Object.values(conf.campos).map(c => <th key={c} style={styles.th}>{c}</th>)}
              {(puedeEditar || puedeEliminar) && <th style={styles.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={Object.keys(conf?.campos || {}).length + 1} style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                  {busqueda ? 'Sin resultados' : 'No hay datos'}
                </td>
              </tr>
            ) : filtrados.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                {Object.keys(conf.campos).map(k => <td key={k} style={styles.td}>{item[k]}</td>)}
                {(puedeEditar || puedeEliminar) && (
                  <td style={{ ...styles.td, display: 'flex', gap: 8 }}>
                    {puedeEditar && (
                      <button 
                        onClick={() => { setSeleccionado(item); setMostrarModal(true); }}
                        style={{ padding: '5px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {puedeEliminar && (
                      <button 
                        onClick={() => eliminar(item)}
                        style={{ padding: '5px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{filtrados.length} registro(s)</p>
    </div>
  );
};

// ─── BITÁCORA ─────────────────────────────────────────────────────────────
const Bitacora = () => {
  const [registros, setRegistros] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [cargando, setCargando] = useState(true);

  const colores = {
    login:     { bg: '#dcfce7', color: '#16a34a' },
    logout:    { bg: '#f3f4f6', color: '#6b7280' },
    ver:       { bg: '#dbeafe', color: '#2563eb' },
    crear:     { bg: '#d1fae5', color: '#059669' },
    modificar: { bg: '#fef3c7', color: '#d97706' },
    eliminar:  { bg: '#fee2e2', color: '#dc2626' },
  };

  const cargar = async () => {
    setCargando(true);
    try { 
      const res = await api.get('bitacora/'); 
      setRegistros(res.data); 
      setFiltrados(res.data); 
    } catch { 
      console.error('Error cargando bitácora'); 
    } finally { 
      setCargando(false); 
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    let r = registros;
    if (filtroAccion) r = r.filter(x => x.accion === filtroAccion);
    if (filtroModulo) r = r.filter(x => x.modulo === filtroModulo);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      r = r.filter(x => 
        x.usuario.toLowerCase().includes(q) || 
        x.descripcion.toLowerCase().includes(q) || 
        x.ip.includes(q)
      );
    }
    setFiltrados(r);
  }, [busqueda, filtroAccion, filtroModulo, registros]);

  const acciones = [...new Set(registros.map(r => r.accion))];
  const modulos  = [...new Set(registros.map(r => r.modulo))];
  const sel = { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', cursor: 'pointer' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#502bc0', margin: 0, fontWeight: 'bold' }}>📜 Bitácora del Sistema</h2>
        <button onClick={cargar} style={{ padding: '8px 16px', background: '#502bc0', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          🔄 Actualizar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input 
          placeholder="🔍 Buscar usuario, descripción, IP..." 
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)} 
          style={{ ...sel, width: 260 }} 
        />
        <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)} style={sel}>
          <option value="">Todas las acciones</option>
          {acciones.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} style={sel}>
          <option value="">Todos los módulos</option>
          {modulos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(busqueda || filtroAccion || filtroModulo) && (
          <button onClick={() => { setBusqueda(''); setFiltroAccion(''); setFiltroModulo(''); }}
            style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>⏳ Cargando bitácora...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha y Hora</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Módulo</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#999' }}>No hay registros</td></tr>
              ) : filtrados.map((r, i) => {
                const c = colores[r.accion] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontSize: 13, color: '#555' }}>{r.fecha_hora}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{r.usuario}</td>
                    <td style={styles.td}>
                      <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {r.accion}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textTransform: 'capitalize', fontSize: 13 }}>{r.modulo}</td>
                    <td style={{ ...styles.td, fontSize: 13, color: '#555' }}>{r.descripcion}</td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#999', fontFamily: 'monospace' }}>{r.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{filtrados.length} de {registros.length} registros</p>
    </div>
  );
};

// ─── SECCIÓN TRABAJADORES (GESTIÓN SUBUSUARIOS) ──────────────────────────
const SeccionUsuarios = () => {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [permisos, setPermisos] = useState({
    clientes: { ver: false, crear: false, modificar: false, eliminar: false },
    buses:    { ver: false, crear: false, modificar: false, eliminar: false },
    choferes: { ver: false, crear: false, modificar: false, eliminar: false },
    viajes:   { ver: false, crear: false, modificar: false, eliminar: false },
    ventas:   { ver: false, crear: false, modificar: false, eliminar: false },
    bitacora: { ver: false },
  });

  const manejarPermiso = (modulo, accion) =>
    setPermisos(prev => ({ ...prev, [modulo]: { ...prev[modulo], [accion]: !prev[modulo][accion] } }));

  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('usuarios/crear/', { ...form, permisos });
      alert(res.data.mensaje || '✅ Usuario creado correctamente');
      setForm({ username: '', password: '', email: '' });
    } catch (err) { 
      alert(err.response?.data?.mensaje || 'Error al crear usuario'); 
    }
  };

  return (
    <div style={styles.formulario}>
      <h3 style={{ color: '#502bc0', marginBottom: 16, fontWeight: 'bold' }}>👤 Registrar Nuevo Trabajador</h3>
      <form onSubmit={guardarUsuario}>
        <input style={styles.input} placeholder="Usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        <input style={styles.input} type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <input style={styles.input} type="email" placeholder="Email (opcional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        
        <h4 style={{ marginTop: 16, marginBottom: 10, fontSize: 14, color: '#333', fontWeight: 'bold' }}>Asignar Permisos por Módulo</h4>
        {Object.keys(permisos).map(modulo => (
          <div key={modulo} style={{ marginBottom: 10, padding: '8px 12px', background: '#f8f8f8', borderRadius: 8 }}>
            <strong style={{ fontSize: 12, textTransform: 'uppercase', color: '#502bc0' }}>{modulo}</strong>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
              {Object.keys(permisos[modulo]).map(accion => (
                <label key={accion} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={permisos[modulo][accion]} onChange={() => manejarPermiso(modulo, accion)} /> {accion}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" style={{ ...styles.btnPrimary, marginTop: 16 }}>✅ Crear Trabajador</button>
      </form>
    </div>
  );
};

// ─── MÓDULO PREMIUM DE GESTIÓN DE VENTAS (TICKET SALES) ───────────────────
const ModuloVentas = () => {
  const { tienePermiso } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);

  // Campos formulario venta
  const [rutas, setRutas] = useState([]);
  const [viajesDisponibles, setViajesDisponibles] = useState([]);
  const [tiposPasajero, setTiposPasajero] = useState([]);
  
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [fechaViaje, setFechaViaje] = useState('');
  
  // Datos cliente buscador
  const [ciPasajero, setCiPasajero] = useState('');
  const [nombrePasajero, setNombrePasajero] = useState('');
  const [telefonoPasajero, setTelefonoPasajero] = useState('');
  const [tipoPasajero, setTipoPasajero] = useState('');
  
  // Mapa de asientos
  const [asientos, setAsientos] = useState([]);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);

  const cargarVentas = async () => {
    try {
      const res = await api.get('pasajes/');
      setVentas(res.data);
      setFiltrados(res.data);
    } catch {
      console.error('Error cargando ventas');
    }
  };

  useEffect(() => {
    cargarVentas();
    api.get('rutas/').then(res => setRutas(res.data)).catch(console.error);
    api.get('tipos-pasajero/').then(res => {
      setTiposPasajero(res.data);
      if (res.data.length > 0) setTipoPasajero(res.data[0].id_tipo);
    }).catch(console.error);
  }, []);

  // Filtrado reactivo de ventas
  useEffect(() => {
    if (!busqueda.trim()) { setFiltrados(ventas); return; }
    const q = busqueda.toLowerCase();
    setFiltrados(ventas.filter(x => 
      x.nombre_pasajero.toLowerCase().includes(q) || 
      String(x.ci_pasajero).includes(q) || 
      String(x.nro_asiento).includes(q) || 
      String(x.placa_bus).toLowerCase().includes(q)
    ));
  }, [busqueda, ventas]);

  // Buscador de clientes por CI en tiempo real
  useEffect(() => {
    if (ciPasajero.length >= 5) {
      api.get(`clientes/?search=${ciPasajero}`).then(res => {
        const exactMatch = res.data.find(c => String(c.ci) === String(ciPasajero));
        if (exactMatch) {
          setNombrePasajero(exactMatch.nombre);
          setTelefonoPasajero(exactMatch.telefono);
        }
      }).catch(console.error);
    }
  }, [ciPasajero]);

  // Cargar viajes disponibles en base a la ruta
  const manejarCambioRuta = async (idRuta) => {
    const r = rutas.find(x => String(x.id_ruta) === String(idRuta));
    setRutaSeleccionada(r);
    setViajeSeleccionado(null);
    setAsientos([]);
    setAsientoSeleccionado(null);
    if (!r) return;

    try {
      const res = await api.get(`viajes-disponibles/?id_ruta=${r.id_ruta}&fecha=${fechaViaje || '2026-06-01'}`);
      setViajesDisponibles(res.data);
    } catch {
      alert('Error al buscar horarios');
    }
  };

  // Cargar asientos interactivos
  const manejarSeleccionViaje = async (idViaje) => {
    const v = viajesDisponibles.find(x => String(x.id_viaje) === String(idViaje));
    setViajeSeleccionado(v);
    setAsientoSeleccionado(null);
    if (!v || !rutaSeleccionada || !fechaViaje) return;

    setCargandoAsientos(true);
    try {
      const res = await api.get(`asientos-disponibles/?origen=${rutaSeleccionada.origen}&destino=${rutaSeleccionada.destino}&fecha_viaje=${fechaViaje}&hora_salida=${v.hora}`);
      setAsientos(res.data.asientos);
    } catch {
      alert('Error al cargar disponibilidad de asientos');
    } finally {
      setCargandoAsientos(false);
    }
  };

  const guardarVenta = async (e) => {
    e.preventDefault();
    if (!asientoSeleccionado) {
      alert('⚠️ Por favor, selecciona un asiento en el bus.');
      return;
    }

    try {
      await api.post('registrar-pasaje/', {
        nombre_pasajero: nombrePasajero,
        ci_pasajero: ciPasajero,
        telefono_pasajero: telefonoPasajero,
        id_tipo: tipoPasajero,
        origen: rutaSeleccionada.origen,
        destino: rutaSeleccionada.destino,
        fecha_viaje: fechaViaje,
        hora_salida: viajeSeleccionado.hora,
        nro_asiento: asientoSeleccionado,
      });

      alert('✅ Venta de pasaje registrada con éxito');
      setMostrarModalVenta(false);
      
      // Limpiar campos
      setCiPasajero(''); setNombrePasajero(''); setTelefonoPasajero('');
      setRutaSeleccionada(null); setViajeSeleccionado(null); setAsientoSeleccionado(null);
      setAsientos([]);
      
      cargarVentas();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar la venta de pasaje');
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm('¿Deseas cancelar/eliminar esta venta de pasaje de forma permanente?')) return;
    try {
      await api.delete(`pasajes/${id}/`);
      alert('🗑️ Venta cancelada con éxito');
      cargarVentas();
    } catch {
      alert('Error al cancelar la venta.');
    }
  };

  return (
    <div>
      {/* MODAL: REGISTRAR NUEVA VENTA */}
      {mostrarModalVenta && (
        <div style={ms.overlay}>
          <div style={{ ...ms.modal, width: 780, display: 'flex', gap: 24 }}>
            {/* Formulario Izquierda */}
            <form onSubmit={guardarVenta} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ color: '#502bc0', margin: '0 0 12px 0', fontWeight: 'bold', fontSize: 18 }}>🎫 Nueva Venta de Pasaje</h3>
              
              <div>
                <label style={ms.label}>C.I. CLIENTE (BUSCADOR AUTOMÁTICO)</label>
                <input style={ms.input} placeholder="C.I. Pasajero" value={ciPasajero} onChange={e => setCiPasajero(e.target.value)} required />
              </div>

              <div>
                <label style={ms.label}>NOMBRE COMPLETO</label>
                <input style={ms.input} placeholder="Nombre Pasajero" value={nombrePasajero} onChange={e => setNombrePasajero(e.target.value)} required />
              </div>

              <div>
                <label style={ms.label}>NRO. CELULAR</label>
                <input style={ms.input} placeholder="Celular" value={telefonoPasajero} onChange={e => setTelefonoPasajero(e.target.value)} required />
              </div>

              <div>
                <label style={ms.label}>TIPO PASAJERO</label>
                <select style={ms.input} value={tipoPasajero} onChange={e => setTipoPasajero(e.target.value)} required>
                  {tiposPasajero.map(t => (
                    <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={ms.label}>FECHA DE VIAJE</label>
                <input type="date" style={ms.input} value={fechaViaje} onChange={e => { setFechaViaje(e.target.value); setViajeSeleccionado(null); }} required />
              </div>

              <div>
                <label style={ms.label}>SELECCIONAR RUTA</label>
                <select style={ms.input} onChange={e => manejarCambioRuta(e.target.value)} required>
                  <option value="">Selecciona Ruta...</option>
                  {rutas.map(r => (
                    <option key={r.id_ruta} value={r.id_ruta}>{r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={ms.label}>HORARIO DE VIAJE</label>
                <select style={ms.input} disabled={!rutaSeleccionada || !fechaViaje} onChange={e => manejarSeleccionViaje(e.target.value)} required>
                  <option value="">Selecciona Horario...</option>
                  {viajesDisponibles.map(v => (
                    <option key={v.id_viaje} value={v.id_viaje}>Hora: {v.hora} | Bus: {v.placa}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="submit" style={ms.btnGuardar}>Registrar Venta</button>
                <button type="button" onClick={() => setMostrarModalVenta(false)} style={ms.btnCancelar}>Cerrar</button>
              </div>
            </form>

            {/* Mapa de asientos interactivo Derecha */}
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', background: '#f8f9fa', padding: 18, borderRadius: 10, border: '1px solid #eee' }}>
              <h4 style={{ color: '#333', fontSize: 13, margin: '0 0 10px 0', fontWeight: 'bold', textAlign: 'center' }}>🗺️ SELECCIÓN DE ASIENTO</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'block', width: 10, height: 10, background: '#16a34a', borderRadius: 3 }} /> Libre</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'block', width: 10, height: 10, background: '#dc2626', borderRadius: 3 }} /> Ocupado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'block', width: 10, height: 10, background: '#502bc0', borderRadius: 3 }} /> Seleccionado</div>
              </div>

              {cargandoAsientos ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#999', fontSize: 12 }}>⏳ Cargando asientos...</div>
              ) : asientos.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#999', fontSize: 12, lineHeight: 1.4 }}>Selecciona Fecha, Ruta y Horario para visualizar los asientos.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '10px 0' }}>
                  {asientos.map(a => {
                    const isSelected = asientoSeleccionado === a.nro_asiento;
                    const bg = a.ocupado ? '#fee2e2' : isSelected ? '#502bc0' : '#dcfce7';
                    const col = a.ocupado ? '#dc2626' : isSelected ? '#fff' : '#16a34a';
                    const cursor = a.ocupado ? 'not-allowed' : 'pointer';

                    return (
                      <button
                        key={a.nro_asiento}
                        type="button"
                        onClick={() => !a.ocupado && setAsientoSeleccionado(a.nro_asiento)}
                        style={{
                          background: bg,
                          color: col,
                          border: `1px solid ${a.ocupado ? '#fecaca' : isSelected ? '#502bc0' : '#bbf7d0'}`,
                          padding: '8px 0',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 'bold',
                          cursor: cursor,
                          transition: '0.2s'
                        }}
                        disabled={a.ocupado}
                      >
                        {a.nro_asiento}
                      </button>
                    );
                  })}
                </div>
              )}
              {asientoSeleccionado && (
                <div style={{ textAlign: 'center', background: '#eef2ff', padding: 8, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>
                  Asiento Seleccionado: {asientoSeleccionado}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#502bc0', margin: 0, fontWeight: 'bold' }}>🎫 Gestión de Pasajes Vendidos</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            placeholder="🔍 Buscar venta por pasajero, CI, bus..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: 280 }} 
          />
          {tienePermiso('ventas', 'crear') && (
            <button 
              style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => { setMostrarModalVenta(true); }}
            >
              ➕ Registrar Venta
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE VENTAS */}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.tabla}>
          <thead>
            <tr>
              <th style={styles.th}>Boleto ID</th>
              <th style={styles.th}>Pasajero</th>
              <th style={styles.th}>C.I.</th>
              <th style={styles.th}>Teléfono</th>
              <th style={styles.th}>Asiento</th>
              <th style={styles.th}>Bus (Placa)</th>
              <th style={styles.th}>Viaje ID</th>
              <th style={styles.th}>Precio</th>
              <th style={styles.th}>Estado</th>
              {tienePermiso('ventas', 'eliminar') && <th style={styles.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                  No hay ventas registradas.
                </td>
              </tr>
            ) : filtrados.map((v, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>#{v.id_pasaje}</td>
                <td style={styles.td}>{v.nombre_pasajero}</td>
                <td style={styles.td}>{v.ci_pasajero}</td>
                <td style={styles.td}>{v.telefono_pasajero}</td>
                <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>{v.nro_asiento}</td>
                <td style={styles.td}>{v.placa_bus}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>{v.id_viaje}</td>
                <td style={{ ...styles.td, color: '#16a34a', fontWeight: 'bold' }}>Bs. {v.precio_final}</td>
                <td style={styles.td}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: v.estado_pasaje === 'VENDIDO' ? '#dcfce7' : '#fee2e2',
                    color: v.estado_pasaje === 'VENDIDO' ? '#16a34a' : '#dc2626'
                  }}>
                    {v.estado_pasaje}
                  </span>
                </td>
                {tienePermiso('ventas', 'eliminar') && (
                  <td style={styles.td}>
                    <button 
                      onClick={() => eliminarVenta(v.id_pasaje)}
                      style={{ padding: '5px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                      🗑️ Cancelar Venta
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{filtrados.length} venta(s) registrada(s)</p>
    </div>
  );
};

// ─── CONFIGURAR CUENTA (CAMBIO DE CONTRASEÑA Y EMAIL) ─────────────────────
const ModuloConfigurarCuenta = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [correo, setCorreo] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Cargar email actual al abrir
  useEffect(() => {
    api.get('mi-perfil/').then(res => {
      setCorreo(res.data.email || '');
    }).catch(console.error);
  }, []);

  const guardarCambios = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    // Si intenta cambiar la contraseña, validar requisitos
    if (newPassword) {
      if (newPassword.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Las nuevas contraseñas no coinciden.');
        return;
      }
      if (!oldPassword) {
        setError('Debes ingresar tu contraseña actual para realizar cambios.');
        return;
      }
    }

    if (!correo.trim()) {
      setError('El correo electrónico de recuperación es obligatorio.');
      return;
    }

    setCargando(true);
    try {
      const payload = { correo };
      if (newPassword) {
        payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }

      const res = await api.post('cambiar-credenciales/', payload);
      setMensaje(res.data.mensaje || '✅ Datos actualizados con éxito.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar tu cuenta. Verifica tu contraseña actual.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.formulario}>
      <h2 style={{ color: '#502bc0', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: 20 }}>🔑 Configurar Cuenta</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Cambia tu clave de seguridad o actualiza tu correo de recuperación institucional.</p>
      
      {mensaje && <p style={{ color: '#16a34a', background: '#dcfce7', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: '0 0 16px 0', textAlign: 'center', fontWeight: 'bold' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: '0 0 16px 0', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={ms.label}>CORREO ELECTRÓNICO DE RECUPERACIÓN</label>
          <input 
            type="email" 
            style={styles.input} 
            value={correo} 
            onChange={e => setCorreo(e.target.value)} 
            required 
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div style={{ height: '1px', background: '#eee', margin: '8px 0' }} />
        <h4 style={{ color: '#333', fontSize: 13, margin: '0 0 4px 0', fontWeight: 'bold' }}>🔐 Cambiar Contraseña (Opcional)</h4>

        <div>
          <label style={ms.label}>CONTRASEÑA ACTUAL</label>
          <input 
            type="password" 
            style={styles.input} 
            value={oldPassword} 
            onChange={e => setOldPassword(e.target.value)} 
            placeholder="********"
          />
        </div>

        <div>
          <label style={ms.label}>NUEVA CONTRASEÑA</label>
          <input 
            type="password" 
            style={styles.input} 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            placeholder="********"
          />
        </div>

        <div>
          <label style={ms.label}>CONFIRMAR NUEVA CONTRASEÑA</label>
          <input 
            type="password" 
            style={styles.input} 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            placeholder="********"
          />
        </div>

        <button type="submit" style={{ ...styles.btnPrimary, marginTop: 8 }} disabled={cargando}>
          {cargando ? 'Guardando Cambios...' : '✅ Actualizar Configuración'}
        </button>
      </form>
    </div>
  );
};

// ─── PANEL PRINCIPAL ───────────────────────────────────────────────────────
const PanelAdmin = () => {
  const { user, logout, tienePermiso } = useAuth();
  const [modulo, setModulo] = useState('inicio');

  useEffect(() => {
    if (modulo === 'inicio' && user && user.rol !== 'superusuario') {
      const posibles = ['ventas', 'clientes', 'buses', 'choferes', 'viajes'];
      const permitido = posibles.find(m => tienePermiso(m, 'ver'));
      if (permitido) setModulo(permitido);
    }
  }, [user, tienePermiso, modulo]);

  const navItem = (mod, label) => (
    <button
      style={{ 
        ...styles.sideItem, 
        background: modulo === mod ? '#f0ebff' : 'none', 
        color: modulo === mod ? '#502bc0' : '#333', 
        fontWeight: modulo === mod ? 'bold' : 'normal' 
      }}
      onClick={() => setModulo(mod)}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.layout}>
      <header style={styles.navbar}>
        <div style={{ fontWeight: 'bold', fontSize: 18, letterSpacing: '0.5px' }}>🚌 SISTEMA TERMINAL</div>
        <div style={styles.navRight}>
          <span style={{ fontSize: 14, fontWeight: '500' }}>
            👤 {user?.username} <small style={{ opacity: 0.8, marginLeft: 4, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>{user?.rol}</small>
          </span>
          <button onClick={logout} style={styles.btnLogout}>Cerrar Sesión</button>
        </div>
      </header>
      <div style={styles.main}>
        <aside style={styles.sidebar}>
          
          <div style={styles.sideTitle}>OPERACIONES</div>
          {tienePermiso('ventas', 'ver') && navItem('ventas', '🎫 Gestionar Ventas')}
          {tienePermiso('clientes','ver') && navItem('clientes',  '👥 Clientes')}
          {tienePermiso('buses','ver')    && navItem('buses',     '🚌 Buses')}
          {tienePermiso('choferes','ver') && navItem('choferes',  '👨‍✈️ Choferes')}
          {tienePermiso('viajes','ver')   && navItem('viajes',    '🗺️ Viajes')}
          
          <div style={styles.sideTitle}>SISTEMA</div>
          {user?.rol === 'superusuario' && navItem('gestion_usuarios', '⚙️ Gestión Usuarios')}
          {(user?.rol === 'superusuario' || tienePermiso('bitacora','ver')) && navItem('bitacora', '📜 Bitácora')}
          {navItem('password', '🔑 Configurar Cuenta')}
        </aside>
        
        <main style={styles.content}>
          {modulo === 'inicio' && (
            <div style={{ textAlign: 'center', marginTop: 100 }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🚌</div>
              <h2 style={{ color: '#502bc0', fontWeight: 'bold' }}>Bienvenido al Panel Administrativo</h2>
              <p style={{ color: '#888', fontSize: 14 }}>Selecciona una opción del menú de operaciones para gestionar el terminal.</p>
            </div>
          )}
          {modulo === 'gestion_usuarios' && user?.rol === 'superusuario' && <SeccionUsuarios />}
          {['clientes', 'buses', 'choferes', 'viajes'].includes(modulo) && <ModuloDinamico tipo={modulo} />}
          {modulo === 'bitacora' && <Bitacora />}
          {modulo === 'ventas' && <ModuloVentas />}
          {modulo === 'password' && <ModuloConfigurarCuenta />}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layout:    { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'Arial, sans-serif' },
  navbar:    { display: 'flex', justifyContent: 'space-between', padding: '0 25px', background: '#502bc0', color: 'white', height: 60, alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' },
  navRight:  { display: 'flex', gap: 20, alignItems: 'center' },
  main:      { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:   { width: 240, background: '#fff', borderRight: '1px solid #e1e4e8', padding: '15px 10px', overflowY: 'auto' },
  sideTitle: { fontSize: 11, color: '#9ba4b0', marginTop: 22, marginBottom: 6, fontWeight: 'bold', letterSpacing: 1, paddingLeft: 14 },
  sideItem:  { width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 8, fontSize: 14, transition: '0.2s', display: 'block', marginBottom: 2 },
  content:   { flex: 1, padding: 30, overflowY: 'auto' },
  tabla:     { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  th:        { textAlign: 'left', padding: '14px 16px', background: '#502bc0', color: 'white', fontSize: 13, fontWeight: 'bold' },
  td:        { padding: '12px 16px', borderBottom: '1px solid #edf0f2', fontSize: 14, color: '#333' },
  formulario:{ background: '#fff', padding: '30px 28px', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', maxWidth: 520, margin: '0 auto' },
  input:     { width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' },
  btnPrimary:{ width: '100%', padding: 12, background: '#502bc0', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
  btnLogout: { background: '#dc2626', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 },
};

export default PanelAdmin;
