import React, { useState, useEffect } from "react";
import api from "../../api";

const styles = {
  tabla: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
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
};

const SeccionBitacora = () => {
  const [registros, setRegistros] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [cargando, setCargando] = useState(true);

  const colores = {
    login: { bg: "#dcfce7", color: "#16a34a" },
    logout: { bg: "#f3f4f6", color: "#6b7280" },
    ver: { bg: "#dbeafe", color: "#2563eb" },
    crear: { bg: "#d1fae5", color: "#059669" },
    modificar: { bg: "#fef3c7", color: "#d97706" },
    eliminar: { bg: "#fee2e2", color: "#dc2626" },
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get("bitacora/");
      setRegistros(res.data);
      setFiltrados(res.data);
    } catch {
      console.error("Error cargando bitácora");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    let r = registros;
    if (filtroAccion) r = r.filter((x) => x.accion === filtroAccion);
    if (filtroModulo) r = r.filter((x) => x.modulo === filtroModulo);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      r = r.filter(
        (x) =>
          x.usuario.toLowerCase().includes(q) ||
          x.descripcion.toLowerCase().includes(q) ||
          x.ip.includes(q)
      );
    }
    setFiltrados(r);
  }, [busqueda, filtroAccion, filtroModulo, registros]);

  const acciones = [...new Set(registros.map((r) => r.accion))];
  const modulos = [...new Set(registros.map((r) => r.modulo))];
  const sel = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 13,
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold" }}>📜 Bitácora del Sistema</h2>
        <button
          onClick={cargar}
          style={{
            padding: "8px 16px",
            background: "#502bc0",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Buscar usuario, descripción, IP..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...sel, width: 260 }}
        />
        <select
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
          style={sel}
        >
          <option value="">Todas las acciones</option>
          {acciones.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          style={sel}
        >
          <option value="">Todos los módulos</option>
          {modulos.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {(busqueda || filtroAccion || filtroModulo) && (
          <button
            onClick={() => {
              setBusqueda("");
              setFiltroAccion("");
              setFiltroModulo("");
            }}
            style={{
              padding: "8px 12px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 50, color: "#999" }}>⏳ Cargando bitácora...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#999" }}>
                    No hay registros
                  </td>
                </tr>
              ) : (
                filtrados.map((r, i) => {
                  const c = colores[r.accion] || { bg: "#f3f4f6", color: "#374151" };
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...styles.td, whiteSpace: "nowrap", fontSize: 13, color: "#555" }}>
                        {r.fecha_hora}
                      </td>
                      <td style={{ ...styles.td, fontWeight: "bold" }}>{r.usuario}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            background: c.bg,
                            color: c.color,
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: "bold",
                            textTransform: "capitalize",
                          }}
                        >
                          {r.accion}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textTransform: "capitalize", fontSize: 13 }}>
                        {r.modulo}
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{r.descripcion}</td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: 12,
                          color: "#999",
                          fontFamily: "monospace",
                        }}
                      >
                        {r.ip}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
        {filtrados.length} de {registros.length} registros
      </p>
    </div>
  );
};

export default SeccionBitacora;
