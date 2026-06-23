import React, { useEffect, useState } from "react";
import { useReportesController } from "../controllers/ReportesController";
import { GeneradorPDF } from "../../../shared/utils/GeneradorPDF";

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#502bc0",
    fontWeight: "bold",
    margin: 0,
  },
  btnPrint: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    transition: "background 0.2s",
  },
  filterCard: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    marginBottom: 24,
  },
  filterRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    minWidth: 180,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
  },
  btnSearch: {
    background: "#502bc0",
    color: "white",
    border: "none",
    padding: "11px 24px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginBottom: 24,
  },
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
  },
  chartSection: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "bold",
  },
  rowItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  rowLabel: {
    color: "#475569",
  },
  rowValue: {
    fontWeight: "bold",
    color: "#1e293b",
  },
};

const PanelReportesUI = () => {
  const { cargando, filtros, setFiltros, datos, generarReporte, pasajesList } =
    useReportesController();

  const [placaSeleccionada, setPlacaSeleccionada] = useState("");

  useEffect(() => {
    generarReporte();
  }, [generarReporte]);

  const handlePrint = () => {
    GeneradorPDF.imprimirVista();
  };

  return (
    <div style={styles.container} className="printable-report">
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Reportes y Estadísticas Consolidadas</h2>
        <button onClick={handlePrint} style={styles.btnPrint}>
          🖨️ Exportar / Imprimir Reporte
        </button>
      </div>

      <div style={styles.filterCard} className="no-print">
        <div style={styles.filterRow}>
          <div style={styles.field}>
            <label style={styles.label}>Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaInicio: e.target.value })
              }
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaFin: e.target.value })
              }
              style={styles.input}
            />
          </div>
          <button
            onClick={generarReporte}
            disabled={cargando}
            style={styles.btnSearch}
          >
            {cargando ? "⏳ Consolidando..." : "📊 Filtrar & Calcular"}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>🎫 Pasajes Vendidos</span>
          <span style={styles.statVal}>{datos.totalPasajesVendidos}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>💰 Ingresos Pasajes</span>
          <span style={{ ...styles.statVal, color: "#502bc0" }}>
            {datos.ingresosPasajes.toFixed(2)} Bs
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>📦 Encomiendas Enviadas</span>
          <span style={styles.statVal}>{datos.totalEncomiendasEnviadas}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>💰 Ingresos Encomiendas</span>
          <span style={{ ...styles.statVal, color: "#10b981" }}>
            {datos.ingresosEncomiendas.toFixed(2)} Bs
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>🚌 Flota de Buses</span>
          <span style={styles.statVal}>
            {datos.busesActivos} <span style={{ fontSize: 16, color: "#64748b" }}>/ {datos.totalBuses} Activos</span>
          </span>
        </div>
      </div>

      <div style={styles.chartSection}>
        <h3 style={styles.sectionTitle}>📈 Rendimiento y Métricas del Terminal</h3>
        <div style={styles.rowItem}>
          <span style={styles.rowLabel}>Ingresos Totales (Caja)</span>
          <span style={{ ...styles.rowValue, color: "#10b981", fontSize: 16 }}>
            {datos.ingresosTotales.toFixed(2)} Bs
          </span>
        </div>
        <div style={styles.rowItem}>
          <span style={styles.rowLabel}>Ruta más Frecuentada</span>
          <span style={styles.rowValue}>{datos.rutaMasFrecuentada}</span>
        </div>
        <div style={styles.rowItem}>
          <span style={styles.rowLabel}>Bus de Mayor Ocupación</span>
          <span style={styles.rowValue}>{datos.busMasUtilizado}</span>
        </div>
        <div style={styles.rowItem}>
          <span style={styles.rowLabel}>Pasajero más Frecuente</span>
          <span style={{ ...styles.rowValue, color: "#502bc0" }}>{datos.pasajeroFrecuente}</span>
        </div>
        <div style={styles.rowItem}>
          <span style={styles.rowLabel}>Fecha del Reporte</span>
          <span style={styles.rowValue}>
            {new Date().toLocaleDateString("es-BO")}
          </span>
        </div>
      </div>

      {/* 1. Pasajeros por Flota (Bus) */}
      <div style={{ ...styles.chartSection, marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>🚌 Pasajeros Registrados por Bus (Flota)</h3>
        <div style={{ marginBottom: 16 }} className="no-print">
          <label style={styles.label}>Selecciona un Bus de la Flota: </label>
          <select
            value={placaSeleccionada}
            onChange={(e) => setPlacaSeleccionada(e.target.value)}
            style={{ ...styles.input, marginLeft: 10 }}
          >
            <option value="">-- Seleccione Bus --</option>
            {datos.busesList && datos.busesList.map((b) => (
              <option key={b.placa} value={b.placa}>
                {b.placa} - {b.modelo}
              </option>
            ))}
          </select>
        </div>
        {placaSeleccionada && (
          <div>
            <h4 style={{ fontSize: 14, color: "#502bc0", marginBottom: 12 }}>
              Pasajeros que abordaron el Bus: <strong>{placaSeleccionada}</strong>
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ textAlign: "left", padding: 8 }}>Pasajero</th>
                  <th style={{ textAlign: "left", padding: 8 }}>C.I.</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Celular</th>
                  <th style={{ textAlign: "center", padding: 8 }}>Asiento</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Ruta</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pasajesList.filter(p => p.placa_bus === placaSeleccionada).length > 0 ? (
                  pasajesList.filter(p => p.placa_bus === placaSeleccionada).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{p.nombre_pasajero}</td>
                      <td style={{ padding: 8 }}>{p.ci_pasajero}</td>
                      <td style={{ padding: 8 }}>{p.telefono_pasajero || "N/A"}</td>
                      <td style={{ padding: 8, textAlign: "center", fontWeight: "bold", color: "#502bc0" }}>#{p.nro_asiento}</td>
                      <td style={{ padding: 8 }}>{p.origen} ➔ {p.destino}</td>
                      <td style={{ padding: 8 }}>{p.fecha_viaje}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: 12, textAlign: "center", color: "#94a3b8" }}>
                      No hay boletos vendidos en este bus para el rango de fechas seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Listado de Choferes */}
      <div style={{ ...styles.chartSection, marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>👨‍✈️ Listado General de Choferes</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ textAlign: "left", padding: 8 }}>Nombre</th>
              <th style={{ textAlign: "left", padding: 8 }}>C.I.</th>
              <th style={{ textAlign: "left", padding: 8 }}>Teléfono</th>
              <th style={{ textAlign: "center", padding: 8 }}>Edad</th>
              <th style={{ textAlign: "left", padding: 8 }}>Licencia</th>
            </tr>
          </thead>
          <tbody>
            {datos.choferesList && datos.choferesList.length > 0 ? (
              datos.choferesList.map((ch) => (
                <tr key={ch.ci} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: "bold" }}>{ch.nombre}</td>
                  <td style={{ padding: 8 }}>{ch.ci}</td>
                  <td style={{ padding: 8 }}>{ch.telefono || "N/A"}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>{ch.edad}</td>
                  <td style={{ padding: 8 }}>{ch.licencia || "Categoría C"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: 12, textAlign: "center", color: "#94a3b8" }}>
                  No hay choferes registrados o no se tienen permisos para verlos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Listado de Clientes */}
      <div style={{ ...styles.chartSection, marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>👥 Registro General de Clientes</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ textAlign: "left", padding: 8 }}>Nombre Completo</th>
              <th style={{ textAlign: "left", padding: 8 }}>Carnet de Identidad (C.I.)</th>
              <th style={{ textAlign: "left", padding: 8 }}>Teléfono</th>
              <th style={{ textAlign: "left", padding: 8 }}>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {datos.clientesList && datos.clientesList.length > 0 ? (
              datos.clientesList.slice(0, 30).map((c) => (
                <tr key={c.ci} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: "bold" }}>{c.nombre}</td>
                  <td style={{ padding: 8 }}>{c.ci}</td>
                  <td style={{ padding: 8 }}>{c.telefono || "N/A"}</td>
                  <td style={{ padding: 8, color: "#64748b" }}>{c.comentario || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: 12, textAlign: "center", color: "#94a3b8" }}>
                  No hay clientes registrados o no se tienen permisos para verlos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PanelReportesUI;
