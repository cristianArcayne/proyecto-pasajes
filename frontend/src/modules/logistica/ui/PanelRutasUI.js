import React, { useState } from "react";
import { useGestionRutasController } from "../controllers/GestionRutasController";

const styles = {
  tabla: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", fontSize: 13 },
  td: { padding: "12px 16px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: 28, borderRadius: 12, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  input: { width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 12 },
  btnGuardar: { padding: "10px 16px", background: "#502bc0", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", flex: 1 },
  btnCancelar: { padding: "10px 16px", background: "#eee", color: "#333", border: "none", borderRadius: 6, cursor: "pointer", flex: 1 }
};

const PanelRutasUI = () => {
  const {
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarRuta,
    eliminarRuta
  } = useGestionRutasController();

  const [form, setForm] = useState({ origen: "", destino: "", precio_ruta: "" });

  const abrirModal = (item) => {
    if (item) {
      setSeleccionado(item);
      setForm({ ...item });
    } else {
      setSeleccionado(null);
      setForm({ origen: "", destino: "", precio_ruta: "" });
    }
    setMostrarModal(true);
  };

  const submitForm = (e) => {
    e.preventDefault();
    guardarRuta(form, !!seleccionado);
  };

  return (
    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      {mostrarModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: "#502bc0", marginBottom: 16, fontWeight: "bold" }}>
              {seleccionado ? "✏️ Editar Ruta" : "➕ Nueva Ruta"}
            </h3>
            <form onSubmit={submitForm}>
              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>ORIGEN</label>
              <input
                style={styles.input}
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                required
                placeholder="Ej. Santa Cruz"
              />

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>DESTINO</label>
              <input
                style={styles.input}
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
                required
                placeholder="Ej. Cochabamba"
              />

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>PRECIO DE RUTA (Bs.)</label>
              <input
                style={styles.input}
                type="number"
                value={form.precio_ruta}
                onChange={(e) => setForm({ ...form, precio_ruta: e.target.value })}
                required
                placeholder="Ej. 100"
              />

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" style={styles.btnGuardar}>Guardar</button>
                <button type="button" style={styles.btnCancelar} onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold" }}>🗺️ Gestión de Rutas de Buses</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="🔍 Buscar ruta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: 200 }}
          />
          <button style={{ padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }} onClick={() => abrirModal(null)}>
            ➕ Nueva Ruta
          </button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Cargando rutas...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Destino</th>
                <th style={styles.th}>Precio de Pasaje</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#999" }}>Sin rutas registradas</td>
                </tr>
              ) : (
                filtrados.map((r, i) => (
                  <tr key={r.id_ruta} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={styles.td}>#{r.id_ruta}</td>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{r.origen}</td>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{r.destino}</td>
                    <td style={{ ...styles.td, color: "#16a34a", fontWeight: "bold" }}>Bs. {r.precio_ruta}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ padding: "4px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => abrirModal(r)}>
                          ✏️ Editar
                        </button>
                        <button style={{ padding: "4px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => eliminarRuta(r.id_ruta)}>
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PanelRutasUI;
