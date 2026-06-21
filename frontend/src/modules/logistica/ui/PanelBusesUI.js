import React, { useState, useEffect } from "react";
import { useGestionBusesController } from "../controllers/GestionBusesController";

const styles = {
  tabla: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", fontSize: 13 },
  td: { padding: "12px 16px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: 28, borderRadius: 12, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  input: { width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 12 },
  btnGuardar: { padding: "10px 16px", background: "#502bc0", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", flex: 1 },
  btnCancelar: { padding: "10px 16px", background: "#eee", color: "#333", border: "none", borderRadius: 6, cursor: "pointer", flex: 1 }
};

const PanelBusesUI = ({ tipo }) => {
  const {
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarItem,
    eliminarItem
  } = useGestionBusesController(tipo);

  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({});
  }, [tipo]);

  const abrirModal = (item) => {
    if (item) {
      setSeleccionado(item);
      setForm({ ...item });
    } else {
      setSeleccionado(null);
      setForm(tipo === "buses" ? { placa: "", modelo: "", capacidad_asientos: "" } : { ci: "", nombre: "", telefono: "", edad: "", licencia: "" });
    }
    setMostrarModal(true);
  };

  const submitForm = (e) => {
    e.preventDefault();
    guardarItem(form, !!seleccionado);
  };

  return (
    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      {mostrarModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: "#502bc0", marginBottom: 16, fontWeight: "bold" }}>
              {seleccionado ? "✏️ Editar" : "➕ Nuevo"} {tipo === "buses" ? "Bus" : "Chofer"}
            </h3>
            <form onSubmit={submitForm}>
              {tipo === "buses" ? (
                <>
                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>PLACA DEL VEHÍCULO</label>
                  <input
                    style={{ ...styles.input, ...(seleccionado ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" } : {}) }}
                    value={form.placa || ""}
                    onChange={(e) => setForm({ ...form, placa: e.target.value })}
                    required
                    disabled={!!seleccionado}
                    placeholder="Ej. 1234-CMF"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>MODELO / DESCRIPCIÓN</label>
                  <input
                    style={styles.input}
                    value={form.modelo || ""}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    required
                    placeholder="Ej. Volvo 2024"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>CAPACIDAD DE ASIENTOS</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.capacidad_asientos || ""}
                    onChange={(e) => setForm({ ...form, capacidad_asientos: e.target.value })}
                    required
                    placeholder="Ej. 40"
                  />
                </>
              ) : (
                <>
                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>C.I. (CARNET DE IDENTIDAD)</label>
                  <input
                    style={{ ...styles.input, ...(seleccionado ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" } : {}) }}
                    value={form.ci || ""}
                    onChange={(e) => setForm({ ...form, ci: e.target.value })}
                    required
                    disabled={!!seleccionado}
                    placeholder="Ej. 123456"
                    type="number"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>NOMBRE COMPLETO</label>
                  <input
                    style={styles.input}
                    value={form.nombre || ""}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    placeholder="Ej. Pedro Choque"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>NRO. CELULAR</label>
                  <input
                    style={styles.input}
                    value={form.telefono || ""}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    required
                    placeholder="Ej. 77011223"
                    type="number"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>EDAD</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.edad || ""}
                    onChange={(e) => setForm({ ...form, edad: e.target.value })}
                    required
                    placeholder="Ej. 42"
                  />

                  <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>CATEGORÍA DE LICENCIA</label>
                  <input
                    style={styles.input}
                    value={form.licencia || ""}
                    onChange={(e) => setForm({ ...form, licencia: e.target.value })}
                    required
                    placeholder="Ej. Categoría C"
                  />
                </>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" style={styles.btnGuardar}>Guardar</button>
                <button type="button" style={styles.btnCancelar} onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold", textTransform: "capitalize" }}>
          {tipo === "buses" ? "🚌 Gestión de Flota de Buses" : "👨‍✈️ Gestión de Choferes / Conductores"}
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder={`🔍 Buscar ${tipo === "buses" ? "bus" : "chofer"}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: 200 }}
          />
          <button style={{ padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }} onClick={() => abrirModal(null)}>
            ➕ Nuevo {tipo === "buses" ? "Bus" : "Chofer"}
          </button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Cargando datos...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.tabla}>
            <thead>
              {tipo === "buses" ? (
                <tr>
                  <th style={styles.th}>Placa</th>
                  <th style={styles.th}>Modelo</th>
                  <th style={styles.th}>Asientos</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              ) : (
                <tr>
                  <th style={styles.th}>C.I.</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Celular</th>
                  <th style={styles.th}>Edad</th>
                  <th style={styles.th}>Licencia</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={tipo === "buses" ? 4 : 6} style={{ textAlign: "center", padding: 20, color: "#999" }}>Sin registros</td>
                </tr>
              ) : (
                filtrados.map((item, i) => (
                  <tr key={tipo === "buses" ? item.placa : item.ci} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    {tipo === "buses" ? (
                      <>
                        <td style={{ ...styles.td, fontWeight: "bold" }}>{item.placa}</td>
                        <td style={styles.td}>{item.modelo}</td>
                        <td style={{ ...styles.td, fontWeight: "bold" }}>{item.capacidad_asientos} asientos</td>
                      </>
                    ) : (
                      <>
                        <td style={styles.td}>{item.ci}</td>
                        <td style={{ ...styles.td, fontWeight: "bold" }}>{item.nombre}</td>
                        <td style={styles.td}>{item.telefono}</td>
                        <td style={styles.td}>{item.edad} años</td>
                        <td style={{ ...styles.td, fontWeight: "bold", color: "#502bc0" }}>{item.licencia}</td>
                      </>
                    )}
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ padding: "4px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => abrirModal(item)}>
                          ✏️ Editar
                        </button>
                        <button style={{ padding: "4px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => eliminarItem(item)}>
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

export default PanelBusesUI;
