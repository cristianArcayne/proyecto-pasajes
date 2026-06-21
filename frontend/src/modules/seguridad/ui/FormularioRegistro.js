import React from "react";
import { useRegistroController } from "../controllers/RegistroController";

const styles = {
  formulario: { maxWidth: "600px", background: "#f8fafc", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  input: {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  btnPrimary: {
    width: "100%",
    padding: "12px",
    background: "#502bc0",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

const FormularioRegistro = ({ onGuardado, onCancelar }) => {
  const {
    form,
    setForm,
    permisos,
    cargando,
    manejarPermiso,
    guardarUsuario,
  } = useRegistroController({ onGuardado });

  return (
    <div style={styles.formulario}>
      <h3 style={{ color: "#502bc0", marginBottom: 16, fontWeight: "bold" }}>
        👤 Registrar Nuevo Trabajador
      </h3>
      <form onSubmit={guardarUsuario}>
        <input
          style={styles.input}
          placeholder="Usuario"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email (opcional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <h4
          style={{
            marginTop: 16,
            marginBottom: 10,
            fontSize: 14,
            color: "#333",
            fontWeight: "bold",
          }}
        >
          Asignar Permisos por Módulo
        </h4>
        {Object.keys(permisos).map((modulo) => {
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
                marginBottom: 10,
                padding: "8px 12px",
                background: "#f8f8f8",
                borderRadius: 8,
              }}
            >
              <strong style={{ fontSize: 12, textTransform: "uppercase", color: "#502bc0" }}>
                {etiquetasModulos[modulo] || modulo}
              </strong>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                {Object.keys(permisos[modulo]).map((accion) => (
                  <label
                    key={accion}
                    style={{
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={permisos[modulo][accion]}
                      onChange={() => manejarPermiso(modulo, accion)}
                    />{" "}
                    {etiquetasAcciones[accion] || accion}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="submit" style={styles.btnPrimary} disabled={cargando}>
            {cargando ? "Registrando..." : "✅ Crear Trabajador"}
          </button>
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              style={{
                ...styles.btnPrimary,
                background: "#eee",
                color: "#333",
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormularioRegistro;
