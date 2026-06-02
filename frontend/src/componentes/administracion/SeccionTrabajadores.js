import React, { useState } from "react";
import api from "../../api";

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

const SeccionTrabajadores = () => {
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [permisos, setPermisos] = useState({
    clientes: { ver: false, crear: false, modificar: false, eliminar: false },
    buses: { ver: false, crear: false, modificar: false, eliminar: false },
    choferes: { ver: false, crear: false, modificar: false, eliminar: false },
    viajes: { ver: false, crear: false, modificar: false, eliminar: false },
    ventas: { ver: false, crear: false, modificar: false, eliminar: false },
    bitacora: { ver: false },
  });

  const manejarPermiso = (modulo, accion) =>
    setPermisos((prev) => ({
      ...prev,
      [modulo]: { ...prev[modulo], [accion]: !prev[modulo][accion] },
    }));

  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("usuarios/crear/", { ...form, permisos });
      alert(res.data.mensaje || "✅ Usuario creado correctamente");
      setForm({ username: "", password: "", email: "" });
      setPermisos({
        clientes: { ver: false, crear: false, modificar: false, eliminar: false },
        buses: { ver: false, crear: false, modificar: false, eliminar: false },
        choferes: { ver: false, crear: false, modificar: false, eliminar: false },
        viajes: { ver: false, crear: false, modificar: false, eliminar: false },
        ventas: { ver: false, crear: false, modificar: false, eliminar: false },
        bitacora: { ver: false },
      });
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al crear usuario");
    }
  };

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
        <button type="submit" style={{ ...styles.btnPrimary, marginTop: 16 }}>
          ✅ Crear Trabajador
        </button>
      </form>
    </div>
  );
};

export default SeccionTrabajadores;
