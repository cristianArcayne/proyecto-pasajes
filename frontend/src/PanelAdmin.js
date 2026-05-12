import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from './api';

// --- COMPONENTE PARA GESTIÓN DE USUARIOS (SOLO SUPERUSUARIO) ---
const SeccionUsuarios = () => {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [permisos, setPermisos] = useState({
    clientes: { ver: false, crear: false, modificar: false, eliminar: false },
    buses: { ver: false, crear: false, modificar: false, eliminar: false },
    choferes: { ver: false, crear: false, modificar: false, eliminar: false },
    viajes: { ver: false, crear: false, modificar: false, eliminar: false },
    bitacora: { ver: false }
  });

  const manejarPermiso = (modulo, accion) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [accion]: !prev[modulo][accion] }
    }));
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await api.post('usuarios/crear/', { ...form, permisos });
      alert(respuesta.data.mensaje);
      setForm({ username: '', password: '', email: '' });
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al crear usuario");
    }
  };

  return (
    <div style={styles.formulario}>
      <h3 style={{ color: '#502bc0' }}>Registrar Nuevo Trabajador</h3>
      <form onSubmit={guardarUsuario}>
        <input style={styles.input} placeholder="Usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        <input style={styles.input} type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <h4 style={{marginTop: '15px', fontSize: '14px'}}>Asignar Permisos</h4>
        {Object.keys(permisos).map(modulo => (
          <div key={modulo} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            <strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>{modulo}</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(permisos[modulo]).map(accion => (
                <label key={accion} style={{ fontSize: '10px' }}>
                  <input type="checkbox" checked={permisos[modulo][accion]} onChange={() => manejarPermiso(modulo, accion)} /> {accion}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" style={styles.btnPrimary}>Crear y Registrar</button>
      </form>
    </div>
  );
};

// --- COMPONENTE PARA TABLAS DINÁMICAS ---
const ModuloDinamico = ({ tipo }) => {
  const [datos, setDatos] = useState([]);
  const config = {
    clientes: { endpoint: 'clientes', campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Teléfono' } },
    buses: { endpoint: 'flotas', campos: { placa: 'Placa', modelo: 'Modelo', capacidad_asientos: 'Asientos' } },
    choferes: { endpoint: 'choferes', campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Celular' } },
    viajes: { endpoint: 'viajes-admin', campos: { fecha: 'Fecha', hora: 'Hora', placa: 'Bus' } }
  };
  const conf = config[tipo];
  
  const cargar = useCallback(async () => {
    if (!conf) return;
    try {
      const res = await api.get(`${conf.endpoint}/`);
      setDatos(res.data);
    } catch (e) { console.error("Error cargando modulo"); }
  }, [conf]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <h2 style={{textTransform: 'capitalize'}}>{tipo}</h2>
      <table style={styles.tabla}>
        <thead><tr>{conf && Object.values(conf.campos).map(c => <th key={c} style={styles.th}>{c}</th>)}</tr></thead>
        <tbody>{datos.map((item, i) => (
          <tr key={i}>{Object.keys(conf.campos).map(k => <td key={k} style={styles.td}>{item[k]}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
};

const PanelAdmin = () => {
  const { user, logout, tienePermiso } = useAuth();
  const [modulo, setModulo] = useState('inicio');

  // EFECTO DE REDIRECCIÓN: Si el usuario entra y no es super, lo mandamos a su primer permiso
  useEffect(() => {
    if (modulo === 'inicio' && user && user.rol !== 'superusuario') {
      const posibles = ['clientes', 'buses', 'choferes', 'viajes'];
      const permitido = posibles.find(m => tienePermiso(m, 'ver'));
      if (permitido) setModulo(permitido);
    }
  }, [user, tienePermiso, modulo]);

  return (
    <div style={styles.layout}>
      <header style={styles.navbar}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>SISTEMA TERMINAL</div>
        <div style={styles.navRight}>
          <span>{user?.username} <small>({user?.rol})</small></span>
          <button onClick={logout} style={styles.btnLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          {/* SECCIÓN OPERACIONES */}
          {(tienePermiso('clientes', 'ver') || tienePermiso('buses', 'ver') || tienePermiso('choferes', 'ver') || tienePermiso('viajes', 'ver')) && (
            <>
              <div style={styles.sideTitle}>OPERACIONES</div>
              {tienePermiso('clientes', 'ver') && <button style={styles.sideItem} onClick={() => setModulo('clientes')}>👥 Clientes</button>}
              {tienePermiso('buses', 'ver') && <button style={styles.sideItem} onClick={() => setModulo('buses')}>🚌 Buses</button>}
              {tienePermiso('choferes', 'ver') && <button style={styles.sideItem} onClick={() => setModulo('choferes')}>👨‍✈️ Choferes</button>}
              {tienePermiso('viajes', 'ver') && <button style={styles.sideItem} onClick={() => setModulo('viajes')}>🗺️ Viajes</button>}
            </>
          )}

          {/* SECCIÓN SISTEMA */}
          <div style={styles.sideTitle}>SISTEMA</div>
          {user?.rol === 'superusuario' && (
            <button style={styles.sideItem} onClick={() => setModulo('gestion_usuarios')}>👥 Gestión Usuarios</button>
          )}
          {(user?.rol === 'superusuario' || tienePermiso('bitacora', 'ver')) && (
            <button style={styles.sideItem} onClick={() => setModulo('bitacora')}>📜 Bitácora</button>
          )}
          <button style={styles.sideItem} onClick={() => setModulo('password')}>🔑 Configurar Cuenta</button>
        </aside>

        <main style={styles.content}>
          {/* RENDERIZADO DE CONTENIDO */}
          {modulo === 'inicio' && (
            <div style={{textAlign: 'center', marginTop: '50px'}}>
              <h2>Bienvenido al Panel de Administración</h2>
              <p>Selecciona una opción del menú para comenzar.</p>
            </div>
          )}
          
          {modulo === 'gestion_usuarios' && user?.rol === 'superusuario' && <SeccionUsuarios />}
          
          {['clientes', 'buses', 'choferes', 'viajes'].includes(modulo) && (
            <ModuloDinamico tipo={modulo} />
          )}

          {modulo === 'bitacora' && <h2>Historial de Bitácora</h2>}
          {modulo === 'password' && <h2>Configuración de Seguridad</h2>}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layout: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' },
  navbar: { display: 'flex', justifyContent: 'space-between', padding: '0 25px', background: '#502bc0', color: 'white', height: '60px', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  navRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '230px', background: '#fff', borderRight: '1px solid #ddd', padding: '15px' },
  sideTitle: { fontSize: '11px', color: '#999', marginTop: '20px', fontWeight: 'bold', letterSpacing: '1px' },
  sideItem: { width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', transition: '0.3s', fontSize: '14px' },
  content: { flex: 1, padding: '30px', overflowY: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  th: { textAlign: 'left', padding: '15px', background: '#502bc0', color: 'white' },
  td: { padding: '12px', borderBottom: '1px solid #eee' },
  formulario: { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd' },
  btnPrimary: { width: '100%', padding: '12px', background: '#502bc0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnLogout: { background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }
};

export default PanelAdmin;