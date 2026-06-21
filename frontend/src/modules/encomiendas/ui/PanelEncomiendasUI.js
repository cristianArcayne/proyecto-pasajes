import React, { useState } from "react";
import { useGestionEncomiendasController } from "../controllers/GestionEncomiendasController";
import RegistroEncomiendaUI from "./RegistroEncomiendaUI";

const styles = {
  container: {
    padding: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#502bc0",
    fontWeight: "bold",
    margin: 0,
  },
  btnToggle: {
    background: "#502bc0",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    transition: "background 0.2s",
  },
  btnToggleCancel: {
    background: "#64748b",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    transition: "background 0.2s",
  },
  searchBar: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    width: "100%",
    maxWidth: 320,
    outline: "none",
    marginBottom: 16,
  },
  tabla: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "bold",
    borderBottom: "2px solid #e2e8f0",
    fontSize: 13,
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    color: "#334155",
    fontSize: 13,
  },
  badge: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "bold",
  },
  btnAnular: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
    transition: "background 0.2s",
  },
};

const PanelEncomiendasUI = () => {
  const {
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    cargarEncomiendas,
    eliminarEncomienda,
    getDetallesViaje,
  } = useGestionEncomiendasController();

  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const handleSaved = () => {
    setMostrarRegistro(false);
    cargarEncomiendas();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Gestión de Encomiendas</h2>
        <button
          onClick={() => setMostrarRegistro(!mostrarRegistro)}
          style={mostrarRegistro ? styles.btnToggleCancel : styles.btnToggle}
        >
          {mostrarRegistro ? "✕ Volver a la Lista" : "➕ Registrar Encomienda"}
        </button>
      </div>

      {mostrarRegistro ? (
        <RegistroEncomiendaUI onSaved={handleSaved} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input
              type="text"
              placeholder="🔍 Buscar por Nro Guía o C.I. remitente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={styles.searchBar}
            />
            <button
              onClick={cargarEncomiendas}
              style={{
                background: "none",
                border: "1px solid #cbd5e1",
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                color: "#475569",
              }}
            >
              🔄 Recargar
            </button>
          </div>

          {cargando ? (
            <div style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>
              ⏳ Cargando encomiendas...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nro Guía</th>
                    <th style={styles.th}>C.I. Remitente</th>
                    <th style={styles.th}>Peso (Kg)</th>
                    <th style={styles.th}>Precio Total</th>
                    <th style={styles.th}>Descripción</th>
                    <th style={styles.th}>Viaje / Bus</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: "center", padding: 30, color: "#94a3b8" }}>
                        No se encontraron encomiendas registradas.
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((e, index) => (
                      <tr key={e.nro_encomienda || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#502bc0" }}>
                          #{e.nro_encomienda}
                        </td>
                        <td style={styles.td}>{e.ci_remitente}</td>
                        <td style={styles.td}>{e.peso_kg} Kg</td>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#10b981" }}>
                          {e.precio_total} Bs
                        </td>
                        <td style={styles.td}>
                          {e.descripcion_carga || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Sin descripción</span>}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{getDetallesViaje(e.id_viaje)}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <button
                            onClick={() => eliminarEncomienda(e.nro_encomienda)}
                            style={styles.btnAnular}
                          >
                            Anular
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelEncomiendasUI;
