import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import api from "../../api";

// ─── MODAL FORMULARIO GENÉRICO (SOPORTE CREAR Y EDITAR) ────────────────────
const ModalFormulario = ({ tipo, item, onClose, onGuardado }) => {
  const campos = {
    clientes: ["ci", "nombre", "telefono", "comentario"],
    buses: ["placa", "modelo", "capacidad_asientos"],
    choferes: ["ci", "nombre", "telefono", "edad", "licencia"],
    viajes: ["id_viaje", "fecha", "hora", "id_ruta", "placa"],
  };

  const isEdit = !!item;
  const [form, setForm] = useState(item ? { ...item } : {});
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    if (tipo === "viajes") {
      api
        .get("rutas/")
        .then((res) => setRutas(res.data))
        .catch(console.error);
      api
        .get("flotas/")
        .then((res) => setBuses(res.data))
        .catch(console.error);
    }
  }, [tipo]);

  const getPK = (t, o) =>
    ({ clientes: o.ci, buses: o.placa, choferes: o.ci, viajes: o.id_viaje }[t]);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const pk = getPK(tipo, item);
        const endpoint = {
          clientes: `clientes/${pk}/`,
          buses: `flotas/${pk}/`,
          choferes: `choferes/${pk}/`,
          viajes: `viajes-admin/${pk}/`,
        }[tipo];
        await api.put(endpoint, form);
      } else {
        const endpoint = {
          clientes: "clientes/",
          buses: "flotas/",
          choferes: "choferes/",
          viajes: "viajes-admin/",
        }[tipo];
        await api.post(endpoint, form);
      }
      alert("✅ Guardado correctamente");
      onGuardado();
      onClose();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar el registro. Verifica los datos.");
    }
  };

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <h3 style={{ color: "#502bc0", marginBottom: 16, fontSize: "18px", fontWeight: "bold" }}>
          {isEdit ? "✏️ Editar" : "➕ Nuevo"} {tipo.toUpperCase()}
        </h3>
        <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {campos[tipo]?.map((k) => {
            const isPK =
              (tipo === "clientes" && k === "ci") ||
              (tipo === "buses" && k === "placa") ||
              (tipo === "choferes" && k === "ci") ||
              (tipo === "viajes" && k === "id_viaje");

            if (tipo === "viajes" && k === "id_ruta") {
              return (
                <div key={k}>
                  <label style={ms.label}>RUTA</label>
                  <select
                    style={ms.input}
                    value={form[k] || ""}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Ruta...</option>
                    {rutas.map((r) => (
                      <option key={r.id_ruta} value={r.id_ruta}>
                        {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (tipo === "viajes" && k === "placa") {
              return (
                <div key={k}>
                  <label style={ms.label}>BUS (PLACA)</label>
                  <select
                    style={ms.input}
                    value={form[k] || ""}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Bus...</option>
                    {buses.map((b) => (
                      <option key={b.placa} value={b.placa}>
                        {b.placa} - {b.modelo} (Capacidad: {b.capacidad_asientos})
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={k}>
                <label style={ms.label}>{k.replace("_", " ").toUpperCase()}</label>
                <input
                  style={{
                    ...ms.input,
                    ...(isPK && isEdit ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" } : {}),
                  }}
                  value={form[k] || ""}
                  type={
                    k === "fecha"
                      ? "date"
                      : k === "hora"
                      ? "time"
                      : k === "capacidad_asientos" || k === "edad"
                      ? "number"
                      : "text"
                  }
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  disabled={isPK && isEdit}
                  required={k !== "comentario"}
                  placeholder={`Ingresa ${k.replace("_", " ")}`}
                />
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="submit" style={ms.btnGuardar}>
              Guardar
            </button>
            <button type="button" onClick={onClose} style={ms.btnCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    width: 420,
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

// ─── MÓDULO DINÁMICO (CLIENTES, BUSES, CHOFERES, VIAJES) ───────────────────
const ModuloDinamico = ({ tipo }) => {
  const { tienePermiso } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const config = {
    clientes: {
      endpoint: "clientes",
      campos: { ci: "C.I.", nombre: "Nombre", telefono: "Teléfono", comentario: "Comentario" },
    },
    buses: {
      endpoint: "flotas",
      campos: { placa: "Placa", modelo: "Modelo", capacidad_asientos: "Asientos" },
    },
    choferes: {
      endpoint: "choferes",
      campos: { ci: "C.I.", nombre: "Nombre", telefono: "Celular", edad: "Edad", licencia: "Licencia" },
    },
    viajes: {
      endpoint: "viajes-admin",
      campos: { id_viaje: "ID Viaje", fecha: "Fecha", hora: "Hora", placa: "Bus" },
    },
  };
  const conf = config[tipo];

  const cargar = useCallback(async () => {
    if (!conf) return;
    try {
      const res = await api.get(`${conf.endpoint}/`);
      setTodos(res.data);
      setFiltrados(res.data);
    } catch {
      console.error("Error cargando módulo");
    }
  }, [conf]);

  useEffect(() => {
    cargar();
    setBusqueda("");
  }, [tipo, cargar]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(todos);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      todos.filter((item) => Object.values(item).some((v) => String(v).toLowerCase().includes(q)))
    );
  }, [busqueda, todos]);

  const eliminar = async (item) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro de forma permanente?")) return;
    try {
      const pk = { clientes: item.ci, buses: item.placa, choferes: item.ci, viajes: item.id_viaje }[tipo];
      const endpoint = {
        clientes: `clientes/${pk}/`,
        buses: `flotas/${pk}/`,
        choferes: `choferes/${pk}/`,
        viajes: `viajes-admin/${pk}/`,
      }[tipo];
      await api.delete(endpoint);
      cargar();
    } catch {
      alert("Error al eliminar. Puede estar relacionado con otras tablas.");
    }
  };

  const puedeEditar = tienePermiso(tipo, "modificar");
  const puedeEliminar = tienePermiso(tipo, "eliminar");
  const puedeCrear = tienePermiso(tipo, "crear");

  return (
    <div>
      {mostrarModal && (
        <ModalFormulario
          tipo={tipo}
          item={seleccionado}
          onClose={() => {
            setMostrarModal(false);
            setSeleccionado(null);
          }}
          onGuardado={cargar}
        />
      )}
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
        <h2 style={{ textTransform: "capitalize", color: "#502bc0", margin: 0, fontWeight: "bold" }}>
          📂 {tipo}
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder={`🔍 Buscar en ${tipo}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: 220 }}
          />
          {puedeCrear && (
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
              onClick={() => {
                setSeleccionado(null);
                setMostrarModal(true);
              }}
            >
              ➕ Nuevo
            </button>
          )}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.tabla}>
          <thead>
            <tr>
              {conf && Object.values(conf.campos).map((c) => <th key={c} style={styles.th}>{c}</th>)}
              {(puedeEditar || puedeEliminar) && <th style={styles.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td
                  colSpan={Object.keys(conf?.campos || {}).length + 1}
                  style={{ textAlign: "center", padding: 30, color: "#999" }}
                >
                  {busqueda ? "Sin resultados" : "No hay datos"}
                </td>
              </tr>
            ) : (
              filtrados.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  {Object.keys(conf.campos).map((k) => (
                    <td key={k} style={styles.td}>
                      {item[k]}
                    </td>
                  ))}
                  {(puedeEditar || puedeEliminar) && (
                    <td style={{ ...styles.td, display: "flex", gap: 8 }}>
                      {puedeEditar && (
                        <button
                          onClick={() => {
                            setSeleccionado(item);
                            setMostrarModal(true);
                          }}
                          style={{
                            padding: "5px 12px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          onClick={() => eliminar(item)}
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
                          🗑️ Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ color: "#999", fontSize: 12, marginTop: 8 }}>{filtrados.length} registro(s)</p>
    </div>
  );
};

export default ModuloDinamico;
