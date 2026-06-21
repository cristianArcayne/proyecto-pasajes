import React, { useState } from "react";
import { useConsultaController } from "../controllers/ConsultaController";

const styles = {
  container: { background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  form: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" },
  input: { padding: "9px 11px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, flex: 1, minWidth: "150px" },
  btn: { padding: "10px 20px", background: "#502bc0", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  tabla: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", fontSize: 13 },
  td: { padding: "12px 16px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 13 }
};

const ConsultaHorariosUI = () => {
  const { rutas, viajesDisponibles, cargando, consultarHorarios } = useConsultaController();
  const [ruta, setRuta] = useState("");
  const [fecha, setFecha] = useState("");

  const submitConsulta = (e) => {
    e.preventDefault();
    consultarHorarios(ruta, fecha);
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#502bc0", margin: "0 0 8px 0", fontWeight: "bold" }}>🔍 Consulta de Horarios y Salidas</h2>
      <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>Consulta los horarios de salidas de buses disponibles por ruta y fecha.</p>

      <form onSubmit={submitConsulta} style={styles.form}>
        <select
          style={styles.input}
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          required
        >
          <option value="">Seleccione Ruta...</option>
          {rutas.map((r) => (
            <option key={r.id_ruta} value={r.id_ruta}>
              {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />

        <button type="submit" style={styles.btn}>Consultar Salidas</button>
      </form>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Buscando salidas disponibles...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Hora de Salida</th>
                <th style={styles.th}>Placa del Bus</th>
                <th style={styles.th}>Asientos Disponibles</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {viajesDisponibles.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#999" }}>
                    No hay salidas programadas para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                viajesDisponibles.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{v.hora}</td>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{v.placa}</td>
                    <td style={styles.td}>{v.libres || "40"} asientos libres</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: "bold",
                          background: "#dcfce7",
                          color: "#16a34a"
                        }}
                      >
                        Programado
                      </span>
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

export default ConsultaHorariosUI;
