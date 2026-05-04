import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PanelAdmin = () => {
  const [mostrarBitacora, setMostrarBitacora] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const nombreUsuario = localStorage.getItem("admin_nombre");

  const cargarBitacora = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem("admin_access");
      const res = await axios.get("http://127.0.0.1:8000/api/bitacora/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistros(res.data);
    } catch (err) {
      console.error("Error cargando bitácora:", err);
    } finally {
      setCargando(false);
    }
  };

  const abrirBitacora = () => {
    setMostrarBitacora(true);
    cargarBitacora();
  };

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <span style={s.bienvenida}>👤 {nombreUsuario}</span>
        <button style={s.botonBitacora} onClick={abrirBitacora}>
          📋 Bitácora
        </button>
      </div>

      {/* ── Tu contenido del panel aquí ── */}
      <div style={s.contenido}>
        <h2>Panel de Administración</h2>
      </div>

      {/* ── Modal Bitácora ── */}
      {mostrarBitacora && (
        <div style={s.overlay} onClick={() => setMostrarBitacora(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>📋 Bitácora del Sistema</h2>
              <button style={s.cerrar} onClick={() => setMostrarBitacora(false)}>✕</button>
            </div>

            {cargando ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Cargando...</p>
            ) : registros.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Sin registros aún.</p>
            ) : (
              <div style={s.tabla}>
                <div style={s.filaHeader}>
                  <span style={s.col}>Fecha y hora</span>
                  <span style={s.col}>Usuario</span>
                  <span style={{ ...s.col, flex: 2 }}>Acción</span>
                  <span style={s.col}>IP</span>
                </div>
                {registros.map((r, i) => (
                  <div key={i} style={{ ...s.fila, backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <span style={s.col}>{r.fecha_hora}</span>
                    <span style={{ ...s.col, fontWeight: 'bold', color: '#502bc0' }}>{r.usuario}</span>
                    <span style={{ ...s.col, flex: 2 }}>{r.accion}</span>
                    <span style={{ ...s.col, color: '#888', fontSize: '12px' }}>{r.ip || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f0f0' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#502bc0', padding: '14px 24px', color: 'white'
  },
  bienvenida: { fontSize: '15px', fontWeight: 'bold' },
  botonBitacora: {
    padding: '8px 18px', backgroundColor: 'white', color: '#502bc0',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '14px'
  },
  contenido: { padding: '30px' },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #eee'
  },
  modalTitulo: { color: '#502bc0', margin: 0 },
  cerrar: {
    background: 'none', border: 'none', fontSize: '20px',
    cursor: 'pointer', color: '#888'
  },
  tabla: { overflowY: 'auto', flex: 1 },
  filaHeader: {
    display: 'flex', padding: '10px 16px', backgroundColor: '#502bc0',
    color: 'white', fontSize: '13px', fontWeight: 'bold', position: 'sticky', top: 0
  },
  fila: {
    display: 'flex', padding: '10px 16px',
    fontSize: '13px', borderBottom: '1px solid #eee'
  },
  col: { flex: 1, paddingRight: '8px' },
};

export default PanelAdmin;