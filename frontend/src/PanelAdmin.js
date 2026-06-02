import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Importación de submódulos subdivididos en español para legibilidad y orden
import ModuloDinamico from "./componentes/administracion/ModuloDinamico";
import SeccionBitacora from "./componentes/administracion/SeccionBitacora";
import SeccionTrabajadores from "./componentes/administracion/SeccionTrabajadores";
import SeccionPasajes from "./componentes/administracion/SeccionPasajes";
import SeccionCuenta from "./componentes/administracion/SeccionCuenta";

const PanelAdmin = () => {
  const { user, logout, tienePermiso } = useAuth();
  const [modulo, setModulo] = useState("inicio");

  useEffect(() => {
    if (modulo === "inicio" && user && user.rol !== "superusuario") {
      const posibles = ["ventas", "clientes", "buses", "choferes", "viajes"];
      const permitido = posibles.find((m) => tienePermiso(m, "ver"));
      if (permitido) setModulo(permitido);
    }
  }, [user, tienePermiso, modulo]);

  const navItem = (mod, label) => (
    <button
      style={{
        ...styles.sideItem,
        background: modulo === mod ? "#f0ebff" : "none",
        color: modulo === mod ? "#502bc0" : "#333",
        fontWeight: modulo === mod ? "bold" : "normal",
      }}
      onClick={() => setModulo(mod)}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.layout}>
      <header style={styles.navbar}>
        <div style={{ fontWeight: "bold", fontSize: 18, letterSpacing: "0.5px" }}>
          🚌 SISTEMA TERMINAL
        </div>
        <div style={styles.navRight}>
          <span style={{ fontSize: 14, fontWeight: "500" }}>
            👤 {user?.username}{" "}
            <small
              style={{
                opacity: 0.8,
                marginLeft: 4,
                background: "rgba(255,255,255,0.2)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {user?.rol}
            </small>
          </span>
          <button onClick={logout} style={styles.btnLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          <div style={styles.sideTitle}>OPERACIONES</div>
          {tienePermiso("ventas", "ver") && navItem("ventas", "🎫 Gestionar Ventas")}
          {tienePermiso("clientes", "ver") && navItem("clientes", "👥 Clientes")}
          {tienePermiso("buses", "ver") && navItem("buses", "🚌 Buses")}
          {tienePermiso("choferes", "ver") && navItem("choferes", "👨‍✈️ Choferes")}
          {tienePermiso("viajes", "ver") && navItem("viajes", "🗺️ Viajes")}

          <div style={styles.sideTitle}>SISTEMA</div>
          {user?.rol === "superusuario" && navItem("gestion_usuarios", "⚙️ Gestión Usuarios")}
          {(user?.rol === "superusuario" || tienePermiso("bitacora", "ver")) &&
            navItem("bitacora", "📜 Bitácora")}
          {navItem("password", "🔑 Configurar Cuenta")}
        </aside>

        <main style={styles.content}>
          {modulo === "inicio" && (
            <div style={{ textAlign: "center", marginTop: 100 }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🚌</div>
              <h2 style={{ color: "#502bc0", fontWeight: "bold" }}>
                Bienvenido al Panel Administrativo
              </h2>
              <p style={{ color: "#888", fontSize: 14 }}>
                Selecciona una opción del menú de operaciones para gestionar el terminal.
              </p>
            </div>
          )}
          {modulo === "gestion_usuarios" && user?.rol === "superusuario" && <SeccionTrabajadores />}
          {["clientes", "buses", "choferes", "viajes"].includes(modulo) && (
            <ModuloDinamico tipo={modulo} />
          )}
          {modulo === "bitacora" && <SeccionBitacora />}
          {modulo === "ventas" && <SeccionPasajes />}
          {modulo === "password" && <SeccionCuenta />}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 25px",
    background: "#502bc0",
    color: "white",
    height: 60,
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  },
  navRight: { display: "flex", gap: 20, alignItems: "center" },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: {
    width: 240,
    background: "#fff",
    borderRight: "1px solid #e1e4e8",
    padding: "15px 10px",
    overflowY: "auto",
  },
  sideTitle: {
    fontSize: 11,
    color: "#9ba4b0",
    marginTop: 22,
    marginBottom: 6,
    fontWeight: "bold",
    letterSpacing: 1,
    paddingLeft: 14,
  },
  sideItem: {
    width: "100%",
    padding: "11px 14px",
    textAlign: "left",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
    fontSize: 14,
    transition: "0.2s",
    display: "block",
    marginBottom: 2,
  },
  content: { flex: 1, padding: 30, overflowY: "auto" },
  btnLogout: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 13,
  },
};

export default PanelAdmin;
