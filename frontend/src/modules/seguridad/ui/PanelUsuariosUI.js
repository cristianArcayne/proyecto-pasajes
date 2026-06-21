import React, { useState } from "react";
import { useGestionUsuariosController } from "../controllers/GestionUsuariosController";
import FormularioRegistro from "./FormularioRegistro";

const styles = {
  container: { background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  tabla: { width: "100%", borderCollapse: "collapse", marginTop: 14 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", fontSize: 13 },
  td: { padding: "12px 16px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 13 },
  btnEdit: { padding: "5px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  btnDel: { padding: "5px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  btnUnlock: { padding: "5px 12px", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  btnNueva: { padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }
};

const PanelUsuariosUI = () => {
  const {
    usuarios,
    cargando,
    seleccionado,
    setSeleccionado,
    cargarUsuarios,
    eliminarUsuario,
    desbloquearUsuario,
    actualizarPermisos
  } = useGestionUsuariosController();

  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [editarPermisosLocal, setEditarPermisosLocal] = useState({});

  const abrirEdicionPermisos = (u) => {
    setSeleccionado(u);
    const plantillaCompleta = {
      clientes: { ver: false, crear: false, modificar: false, eliminar: false },
      buses: { ver: false, crear: false, modificar: false, eliminar: false },
      choferes: { ver: false, crear: false, modificar: false, eliminar: false },
      viajes: { ver: false, crear: false, modificar: false, eliminar: false },
      ventas: { ver: false, crear: false, modificar: false, eliminar: false },
      encomiendas: { ver: false, crear: false, modificar: false, eliminar: false },
      reportes: { ver: false },
      bitacora: { ver: false },
    };
    
    const permisosUsuario = u.permisos || {};
    const permisosCombinados = {};
    
    Object.keys(plantillaCompleta).forEach((modulo) => {
      permisosCombinados[modulo] = {
        ...plantillaCompleta[modulo],
        ...(permisosUsuario[modulo] || {})
      };
    });
    
    setEditarPermisosLocal(permisosCombinados);
  };

  const cambiarPermisoLocal = (modulo, accion) => {
    setEditarPermisosLocal((prev) => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [accion]: !prev[modulo]?.[accion]
      }
    }));
  };

  const renderPermisosResumen = (permisos) => {
    if (!permisos) return "-";
    
    const etiquetasModulos = {
      clientes: "👥 Clientes",
      buses: "🚌 Buses",
      choferes: "👨‍✈️ Choferes",
      viajes: "🗺️ Viajes",
      ventas: "🎫 Ventas",
      encomiendas: "📦 Encomiendas",
      reportes: "📊 Reportes",
      bitacora: "📜 Bitácora",
    };

    const modulosConAcceso = [];
    
    Object.entries(permisos).forEach(([modulo, acciones]) => {
      const accionesActivas = Object.entries(acciones)
        .filter(([_, valor]) => valor === true)
        .map(([accion]) => {
          const etiquetasAcciones = { ver: "ver", crear: "crear", modificar: "mod", eliminar: "elim" };
          return etiquetasAcciones[accion] || accion;
        });

      if (accionesActivas.length > 0) {
        const nombreModulo = etiquetasModulos[modulo] || modulo;
        modulosConAcceso.push({
          nombre: nombreModulo,
          acciones: accionesActivas
        });
      }
    });

    if (modulosConAcceso.length === 0) {
      return <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic" }}>Ninguno</span>;
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "280px" }}>
        {modulosConAcceso.map((m, idx) => (
          <span
            key={idx}
            style={{
              background: "#f0ebff",
              color: "#502bc0",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "11px",
              border: "1px solid #dcd3ff",
              display: "inline-block",
              whiteSpace: "nowrap"
            }}
          >
            <strong>{m.nombre.split(" ").slice(1).join(" ") || m.nombre}:</strong> {m.acciones.join(",")}
          </span>
        ))}
      </div>
    );
  };

  if (mostrarCrear) {
    return (
      <FormularioRegistro
        onGuardado={() => {
          setMostrarCrear(false);
          cargarUsuarios();
        }}
        onCancelar={() => setMostrarCrear(false)}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ color: "#502bc0", margin: 0, fontWeight: "bold" }}>👥 Gestión de Trabajadores</h2>
        <button style={styles.btnNueva} onClick={() => setMostrarCrear(true)}>
          ➕ Registrar Trabajador
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>Cargando trabajadores...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Permisos</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#999" }}>
                    No hay trabajadores registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>#{u.id}</td>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>{u.username}</td>
                    <td style={styles.td}>{u.email || "-"}</td>
                    <td style={styles.td}>{u.rol}</td>
                    <td style={styles.td}>{renderPermisosResumen(u.permisos)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: "bold",
                          background: u.is_active ? "#dcfce7" : "#fee2e2",
                          color: u.is_active ? "#16a34a" : "#dc2626"
                        }}
                      >
                        {u.is_active ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {u.rol !== "superusuario" && (
                          <button style={styles.btnEdit} onClick={() => abrirEdicionPermisos(u)}>
                            🔑 Permisos
                          </button>
                        )}
                        {!u.is_active && (
                          <button style={styles.btnUnlock} onClick={() => desbloquearUsuario(u.id)}>
                            🔓 Desbloquear
                          </button>
                        )}
                        {u.rol !== "superusuario" && (
                          <button style={styles.btnDel} onClick={() => eliminarUsuario(u.id)}>
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Panel para Editar Permisos */}
      {seleccionado && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 500,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <h3 style={{ color: "#502bc0", margin: "0 0 16px 0", fontWeight: "bold" }}>
              🔑 Editar Permisos: {seleccionado.username}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.keys(editarPermisosLocal).map((modulo) => {
                const etiquetasModulos = {
                  clientes: "👥 Clientes",
                  buses: "🚌 Buses",
                  choferes: "👨‍✈️ Choferes",
                  viajes: "🗺️ Viajes",
                  ventas: "🎫 Gestionar Ventas",
                  encomiendas: "📦 Encomiendas",
                  reportes: "📊 Reportes",
                  bitacora: "📜 Bitácora",
                };

                const etiquetasAcciones = {
                  ver: "Ver",
                  crear: "Crear",
                  modificar: "Modificar",
                  eliminar: "Eliminar",
                };

                return (
                  <div
                    key={modulo}
                    style={{
                      padding: "8px 12px",
                      background: "#f8f8f8",
                      borderRadius: 8,
                      border: "1px solid #eee"
                    }}
                  >
                    <strong style={{ fontSize: 12, textTransform: "uppercase", color: "#502bc0" }}>
                      {etiquetasModulos[modulo] || modulo}
                    </strong>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                      {Object.keys(editarPermisosLocal[modulo] || {}).map((accion) => (
                        <label
                          key={accion}
                          style={{
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editarPermisosLocal[modulo]?.[accion] || false}
                            onChange={() => cambiarPermisoLocal(modulo, accion)}
                          />{" "}
                          {etiquetasAcciones[accion] || accion}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                style={{ ...styles.btnNueva, flex: 1 }}
                onClick={() => actualizarPermisos(seleccionado.id, editarPermisosLocal)}
              >
                Guardar Cambios
              </button>
              <button
                style={{ ...styles.btnNueva, background: "#eee", color: "#333", flex: 1 }}
                onClick={() => setSeleccionado(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelUsuariosUI;
