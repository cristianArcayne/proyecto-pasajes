import React from "react";
import { useSesionController } from "../controllers/SesionController";

// Importación de submódulos subdivididos bajo el diseño lógico de paquetes
import PanelUsuariosUI from "./PanelUsuariosUI";
import SeccionBitacora from "./SeccionBitacora";
import SeccionCuenta from "./SeccionCuenta";

import PanelPasajerosUI from "../../logistica/ui/PanelPasajerosUI";
import PanelBusesUI from "../../logistica/ui/PanelBusesUI";
import PanelHorariosUI from "../../logistica/ui/PanelHorariosUI";
import PanelRutasUI from "../../logistica/ui/PanelRutasUI";
import PanelVentasUI from "../../ventas/ui/PanelVentasUI";
import PanelEncomiendasUI from "../../encomiendas/ui/PanelEncomiendasUI";
import PanelReportesUI from "../../reportes/ui/PanelReportesUI";

const MenuPrincipal = () => {
  const { user, logout, tienePermiso, modulo, setModulo } = useSesionController();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItem = (mod, label) => (
    <button
      style={{
        ...styles.sideItem,
        background: modulo === mod ? "#f0ebff" : "none",
        color: modulo === mod ? "#502bc0" : "#333",
        fontWeight: modulo === mod ? "bold" : "normal",
      }}
      onClick={() => {
        setModulo(mod);
        setSidebarOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="dashboard-layout">
      <header className="dashboard-navbar">
        <div className="navbar-brand-container">
          <button 
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div style={{ fontWeight: "bold", fontSize: 18, letterSpacing: "0.5px" }}>
            🚌 SISTEMA TERMINAL
          </div>
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

      <div className="dashboard-main">
        {/* Overlay para cuando la barra lateral está abierta en dispositivos móviles */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div style={styles.sideTitle}>OPERACIONES</div>
          {tienePermiso("ventas", "ver") && navItem("ventas", "🎫 Gestionar Ventas")}
          {tienePermiso("encomiendas", "ver") && navItem("encomiendas", "📦 Encomiendas")}
          {tienePermiso("clientes", "ver") && navItem("clientes", "👥 Clientes")}
          {tienePermiso("buses", "ver") && navItem("buses", "🚌 Buses")}
          {tienePermiso("choferes", "ver") && navItem("choferes", "👨‍✈️ Choferes")}
          {tienePermiso("viajes", "ver") && navItem("viajes", "🗺️ Viajes")}
          {tienePermiso("buses", "ver") && navItem("rutas", "🗺️ Rutas de Buses")}

          <div style={styles.sideTitle}>SISTEMA</div>
          {(user?.rol === "superusuario" || tienePermiso("reportes", "ver")) && navItem("reportes", "📊 Reportes")}
          {user?.rol === "superusuario" && navItem("gestion_usuarios", "⚙️ Gestión Usuarios")}
          {(user?.rol === "superusuario" || tienePermiso("bitacora", "ver")) &&
            navItem("bitacora", "📜 Bitácora")}
          {navItem("password", "🔑 Configurar Cuenta")}
        </aside>

        <main className="dashboard-content">
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
          {modulo === "gestion_usuarios" && user?.rol === "superusuario" && <PanelUsuariosUI />}
          {modulo === "clientes" && <PanelPasajerosUI />}
          {modulo === "buses" && <PanelBusesUI tipo="buses" />}
          {modulo === "choferes" && <PanelBusesUI tipo="choferes" />}
          {modulo === "viajes" && <PanelHorariosUI />}
          {modulo === "rutas" && <PanelRutasUI />}
          {modulo === "bitacora" && <SeccionBitacora />}
          {modulo === "ventas" && <PanelVentasUI />}
          {modulo === "encomiendas" && <PanelEncomiendasUI />}
          {modulo === "reportes" && <PanelReportesUI />}
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

export default MenuPrincipal;
