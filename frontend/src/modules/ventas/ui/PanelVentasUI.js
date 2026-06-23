import React, { useState, useEffect } from "react";
import { useAuth } from "../../../core/context/AuthContext";
import api from "../../../core/services/api";
import { useGestionVentasController } from "../controllers/GestionVentasController";

const ms = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: 28,
    borderRadius: 12,
    width: 780,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  label: { fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: "bold" },
  input: {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    boxSizing: "border-box",
  },
  btnGuardar: {
    flex: 1,
    padding: "11px",
    background: "#502bc0",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnCancelar: {
    flex: 1,
    padding: "11px",
    background: "#eee",
    color: "#333",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

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

const PanelVentasUI = () => {
  const { tienePermiso } = useAuth();
  const {
    filtrados,
    busqueda,
    setBusqueda,
    cargando,
    cargarVentas,
    eliminarVenta,
  } = useGestionVentasController();

  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);

  // Campos formulario venta
  const [rutas, setRutas] = useState([]);
  const [viajesDisponibles, setViajesDisponibles] = useState([]);
  const [tiposPasajero, setTiposPasajero] = useState([]);

  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [fechaViaje, setFechaViaje] = useState("");

  // Datos cliente buscador
  const [ciPasajero, setCiPasajero] = useState("");
  const [nombrePasajero, setNombrePasajero] = useState("");
  const [telefonoPasajero, setTelefonoPasajero] = useState("");
  const [tipoPasajero, setTipoPasajero] = useState("");

  // Mapa de asientos
  const [asientos, setAsientos] = useState([]);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);

  useEffect(() => {
    api
      .get("rutas/")
      .then((res) => setRutas(res.data))
      .catch(console.error);
    api
      .get("tipos-pasajero/")
      .then((res) => {
        setTiposPasajero(res.data);
        if (res.data.length > 0) setTipoPasajero(res.data[0].id_tipo);
      })
      .catch(console.error);
  }, []);

  // Buscador de clientes por CI en tiempo real
  useEffect(() => {
    if (ciPasajero.length >= 5) {
      api
        .get(`clientes/?search=${ciPasajero}`)
        .then((res) => {
          const exactMatch = res.data.find((c) => String(c.ci) === String(ciPasajero));
          if (exactMatch) {
            setNombrePasajero(exactMatch.nombre);
            setTelefonoPasajero(exactMatch.telefono);
          }
        })
        .catch(console.error);
    }
  }, [ciPasajero]);

  // Cargar viajes disponibles en base a la ruta
  const manejarCambioRuta = async (idRuta) => {
    const r = rutas.find((x) => String(x.id_ruta) === String(idRuta));
    setRutaSeleccionada(r);
    setViajeSeleccionado(null);
    setAsientos([]);
    setAsientoSeleccionado(null);
    if (!r) return;

    try {
      const res = await api.get(
        `viajes-disponibles/?id_ruta=${r.id_ruta}&fecha=${fechaViaje || "2026-06-01"}`
      );
      setViajesDisponibles(res.data);
    } catch {
      alert("Error al buscar horarios");
    }
  };

  // Cargar asientos interactivos
  const manejarSeleccionViaje = async (idViaje) => {
    const v = viajesDisponibles.find((x) => String(x.id_viaje) === String(idViaje));
    setViajeSeleccionado(v);
    setAsientoSeleccionado(null);
    if (!v || !rutaSeleccionada || !fechaViaje) return;

    setCargandoAsientos(true);
    try {
      const res = await api.get(
        `asientos-disponibles/?origen=${rutaSeleccionada.origen}&destino=${rutaSeleccionada.destino}&fecha_viaje=${fechaViaje}&hora_salida=${v.hora}`
      );
      setAsientos(res.data.asientos);
    } catch {
      alert("Error al cargar disponibilidad de asientos");
    } finally {
      setCargandoAsientos(false);
    }
  };

  const guardarVenta = async (e) => {
    e.preventDefault();
    if (!asientoSeleccionado) {
      alert("⚠️ Por favor, selecciona un asiento en el bus.");
      return;
    }

    try {
      await api.post("registrar-pasaje/", {
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

      alert("✅ Venta de pasaje registrada con éxito");
      setMostrarModalVenta(false);

      // Limpiar campos
      setCiPasajero("");
      setNombrePasajero("");
      setTelefonoPasajero("");
      setRutaSeleccionada(null);
      setViajeSeleccionado(null);
      setAsientoSeleccionado(null);
      setAsientos([]);

      cargarVentas();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar la venta de pasaje");
    }
  };

  return (
    <div>
      {/* MODAL: REGISTRAR NUEVA VENTA */}
      {mostrarModalVenta && (
        <div style={ms.overlay}>
          <div style={{ ...ms.modal, display: "flex", gap: 24 }}>
            {/* Formulario Izquierda */}
            <form
              onSubmit={guardarVenta}
              style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <h3 style={{ color: "#502bc0", margin: "0 0 12px 0", fontWeight: "bold", fontSize: 18 }}>
                🎫 Nueva Venta de Pasaje
              </h3>

              <div>
                <label style={ms.label}>C.I. CLIENTE</label>
                <input
                  style={ms.input}
                  placeholder="C.I. Pasajero"
                  value={ciPasajero}
                  onChange={(e) => setCiPasajero(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={ms.label}>NOMBRE COMPLETO</label>
                <input
                  style={ms.input}
                  placeholder="Nombre Pasajero"
                  value={nombrePasajero}
                  onChange={(e) => setNombrePasajero(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={ms.label}>NRO. CELULAR</label>
                <input
                  style={ms.input}
                  placeholder="Celular"
                  value={telefonoPasajero}
                  onChange={(e) => setTelefonoPasajero(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={ms.label}>TIPO PASAJERO</label>
                <select
                  style={ms.input}
                  value={tipoPasajero}
                  onChange={(e) => setTipoPasajero(e.target.value)}
                  required
                >
                  {tiposPasajero.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>
                      {t.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={ms.label}>FECHA DE VIAJE</label>
                <input
                  type="date"
                  style={ms.input}
                  value={fechaViaje}
                  onChange={(e) => {
                    setFechaViaje(e.target.value);
                    setViajeSeleccionado(null);
                  }}
                  required
                />
              </div>

              <div>
                <label style={ms.label}>SELECCIONAR RUTA</label>
                <select style={ms.input} onChange={(e) => manejarCambioRuta(e.target.value)} required>
                  <option value="">Selecciona Ruta...</option>
                  {rutas.map((r) => (
                    <option key={r.id_ruta} value={r.id_ruta}>
                      {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={ms.label}>HORARIO DE VIAJE</label>
                <select
                  style={ms.input}
                  disabled={!rutaSeleccionada || !fechaViaje}
                  onChange={(e) => manejarSeleccionViaje(e.target.value)}
                  required
                >
                  <option value="">Selecciona Horario...</option>
                  {viajesDisponibles.map((v) => (
                    <option key={v.id_viaje} value={v.id_viaje}>
                      Hora: {v.hora} | Bus: {v.placa}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button type="submit" style={ms.btnGuardar}>
                  Registrar Venta
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalVenta(false)}
                  style={ms.btnCancelar}
                >
                  Cerrar
                </button>
              </div>
            </form>

            {/* Mapa de asientos interactivo Derecha */}
            <div
              style={{
                width: 280,
                display: "flex",
                flexDirection: "column",
                background: "#f8f9fa",
                padding: 18,
                borderRadius: 10,
                border: "1px solid #eee",
              }}
            >
              <h4
                style={{
                  color: "#333",
                  fontSize: 13,
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                🗺️ SELECCIÓN DE ASIENTO
              </h4>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 11, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "block", width: 10, height: 10, background: "#16a34a", borderRadius: 3 }} /> Libre
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "block", width: 10, height: 10, background: "#dc2626", borderRadius: 3 }} /> Ocupado
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "block", width: 10, height: 10, background: "#502bc0", borderRadius: 3 }} /> Seleccionado
                </div>
              </div>

              {cargandoAsientos ? (
                <div style={{ textAlign: "center", margin: "auto", color: "#999", fontSize: 12 }}>
                  ⏳ Cargando asientos...
                </div>
              ) : asientos.length === 0 ? (
                <div style={{ textAlign: "center", margin: "auto", color: "#999", fontSize: 12, lineHeight: 1.4 }}>
                  Selecciona Fecha, Ruta y Horario para visualizar los asientos.
                </div>
              ) : (
                (() => {
                  const esBusGrande = asientos.length > 35;
                  const columnas = esBusGrande ? 5 : 4;
                  const pasilloIndex = esBusGrande ? 2 : 1;
                  const asientosOrdenados = [...asientos].sort((x, y) => x.nro_asiento - y.nro_asiento);

                  const elementosGrilla = [];
                  let seatIdx = 0;
                  while (seatIdx < asientosOrdenados.length) {
                    for (let col = 0; col < columnas; col++) {
                      if (col === pasilloIndex) {
                        elementosGrilla.push({ tipo: "pasillo", id: `pas-${seatIdx}-${col}` });
                      } else {
                        if (seatIdx < asientosOrdenados.length) {
                          elementosGrilla.push({ tipo: "asiento", datos: asientosOrdenados[seatIdx] });
                          seatIdx++;
                        }
                      }
                    }
                  }

                  return (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                        gap: "8px",
                        padding: "10px 0",
                        boxSizing: "border-box",
                      }}
                    >
                      {elementosGrilla.map((el) => {
                        if (el.tipo === "pasillo") {
                          return (
                            <div key={el.id} style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8", fontSize: "11px", fontWeight: "bold", opacity: 0.5 }}>
                              ||
                            </div>
                          );
                        }
                        const a = el.datos;
                        const isSelected = asientoSeleccionado === a.nro_asiento;
                        const bg = a.ocupado ? "#fee2e2" : isSelected ? "#502bc0" : "#dcfce7";
                        const col = a.ocupado ? "#dc2626" : isSelected ? "#fff" : "#16a34a";
                        const cursor = a.ocupado ? "not-allowed" : "pointer";

                        return (
                          <button
                            key={a.nro_asiento}
                            type="button"
                            disabled={a.ocupado}
                            onClick={() => !a.ocupado && setAsientoSeleccionado(a.nro_asiento)}
                            style={{
                              background: bg,
                              color: col,
                              border: `1px solid ${a.ocupado ? "#fecaca" : isSelected ? "#502bc0" : "#bbf7d0"}`,
                              padding: "8px 0",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: "bold",
                              cursor: cursor,
                              transition: "0.2s",
                            }}
                          >
                            {a.nro_asiento}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()
              )}
              {asientoSeleccionado && (
                <div style={{ textAlign: "center", background: "#eef2ff", padding: 8, borderRadius: 6, border: "1px solid #c7d2fe", fontSize: 13, color: "#3730a3", fontWeight: "bold" }}>
                  Asiento Seleccionado: {asientoSeleccionado}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER MÓDULO */}
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
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold" }}>
          🎫 Gestión de Pasajes Vendidos
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Buscar venta por pasajero, CI, bus..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: 280 }}
          />
          {tienePermiso("ventas", "crear") && (
            <button
              style={{
                padding: "8px 16px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={() => setMostrarModalVenta(true)}
            >
              ➕ Registrar Venta
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE VENTAS */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Cargando pasajes vendidos...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
                {tienePermiso("ventas", "eliminar") && <th style={styles.th}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 30, color: "#999" }}>
                    No hay ventas registradas.
                  </td>
                </tr>
              ) : (
                filtrados.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>#{v.id_pasaje}</td>
                    <td style={styles.td}>{v.nombre_pasajero}</td>
                    <td style={styles.td}>{v.ci_pasajero}</td>
                    <td style={styles.td}>{v.telefono_pasajero}</td>
                    <td style={{ ...styles.td, textAlign: "center", fontWeight: "bold" }}>
                      {v.nro_asiento}
                    </td>
                    <td style={styles.td}>{v.placa_bus}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>{v.id_viaje}</td>
                    <td style={{ ...styles.td, color: "#16a34a", fontWeight: "bold" }}>
                      Bs. {v.precio_final}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: "bold",
                          background: v.estado_pasaje === "VENDIDO" ? "#dcfce7" : "#fee2e2",
                          color: v.estado_pasaje === "VENDIDO" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {v.estado_pasaje}
                      </span>
                    </td>
                    {tienePermiso("ventas", "eliminar") && (
                      <td style={styles.td}>
                        <button
                          onClick={() => eliminarVenta(v.id_pasaje)}
                          style={{
                            padding: "5px 12px",
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          🗑️ Cancelar Venta
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
        {filtrados.length} venta(s) registrada(s)
      </p>
    </div>
  );
};

export default PanelVentasUI;
