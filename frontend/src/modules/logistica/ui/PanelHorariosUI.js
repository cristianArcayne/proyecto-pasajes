import React, { useState } from "react";
import { useGestionHorariosController } from "../controllers/GestionHorariosController";

const styles = {
  tabla: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", fontSize: 13 },
  td: { padding: "12px 16px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: 28, borderRadius: 12, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  input: { width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 12 },
  btnGuardar: { padding: "10px 16px", background: "#502bc0", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", flex: 1 },
  btnCancelar: { padding: "10px 16px", background: "#eee", color: "#333", border: "none", borderRadius: 6, cursor: "pointer", flex: 1 }
};

const PanelHorariosUI = () => {
  const {
    rutas,
    buses,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarViaje,
    eliminarViaje
  } = useGestionHorariosController();

  const [form, setForm] = useState({ id_viaje: "", fecha: "", hora: "", id_ruta: "", placa: "" });

  const abrirModal = (item) => {
    if (item) {
      setSeleccionado(item);
      setForm({ ...item });
    } else {
      setSeleccionado(null);
      setForm({ id_viaje: "", fecha: "", hora: "", id_ruta: "", placa: "" });
    }
    setMostrarModal(true);
  };

  const submitForm = (e) => {
    e.preventDefault();
    guardarViaje(form, !!seleccionado);
  };

  return (
    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      {mostrarModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: "#502bc0", marginBottom: 16, fontWeight: "bold" }}>
              {seleccionado ? "✏️ Editar Horario de Viaje" : "➕ Programar Nuevo Viaje"}
            </h3>
            <form onSubmit={submitForm}>
              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>ID VIAJE</label>
              <input
                style={{ ...styles.input, ...(seleccionado ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" } : {}) }}
                value={form.id_viaje}
                onChange={(e) => setForm({ ...form, id_viaje: e.target.value })}
                required
                disabled={!!seleccionado}
                placeholder="Ej. 101"
                type="number"
              />

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>FECHA DE SALIDA</label>
              <input
                style={styles.input}
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>HORA DE SALIDA</label>
              <input
                style={styles.input}
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                required
              />

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>RUTA</label>
              <select
                style={styles.input}
                value={form.id_ruta}
                onChange={(e) => setForm({ ...form, id_ruta: e.target.value })}
                required
              >
                <option value="">Seleccionar Ruta...</option>
                {rutas.map((r) => (
                  <option key={r.id_ruta} value={r.id_ruta}>
                    {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
                  </option>
                ))}
              </select>

              <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>BUS ASIGNADO (PLACA)</label>
              <select
                style={styles.input}
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value })}
                required
              >
                <option value="">Seleccionar Bus...</option>
                {buses.map((b) => (
                  <option key={b.placa} value={b.placa}>
                    {b.placa} - {b.modelo} (Capacidad: {b.capacidad_asientos})
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" style={styles.btnGuardar}>Guardar</button>
                <button type="button" style={styles.btnCancelar} onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold" }}>🗺️ Programación de Viajes / Horarios</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="🔍 Buscar viaje..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: 200 }}
          />
          <button style={{ padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }} onClick={() => abrirModal(null)}>
            ➕ Programar Viaje
          </button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Cargando viajes...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>ID Viaje</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Ruta ID</th>
                <th style={styles.th}>Bus Placa</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#999" }}>Sin viajes programados</td>
                </tr>
              ) : (
                filtrados.map((v, i) => (
                  <tr key={v.id_viaje} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>#{v.id_viaje}</td>
                    <td style={styles.td}>{v.fecha}</td>
                    <td style={styles.td}>{v.hora}</td>
                    <td style={styles.td}>{v.id_ruta_id || v.id_ruta || "-"}</td>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{v.placa_id || v.placa}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ padding: "4px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => abrirModal(v)}>
                          ✏️ Editar
                        </button>
                        <button style={{ padding: "4px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }} onClick={() => eliminarViaje(v.id_viaje)}>
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

export default PanelHorariosUI;
