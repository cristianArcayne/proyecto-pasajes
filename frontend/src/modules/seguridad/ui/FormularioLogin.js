import React, { useState } from "react";
import { useLoginController } from "../controllers/LoginController";

const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {children}
    {errores[id] && <p style={{ color: "red", fontSize: "12px", margin: 0 }}>{errores[id]}</p>}
  </div>
);

const FormularioLogin = ({ onFirstTimeLogin, onRecoveryClick }) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const {
    usuario,
    setUsuario,
    password,
    setPassword,
    cargando,
    errores,
    clearError,
    manejarLogin,
    bloqueado,
    tiempoRestante,
  } = useLoginController({ onFirstTimeLogin, onRecoveryClick });

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        <h2 style={s.titulo}>🔐 Acceso Administrativo</h2>
        <form onSubmit={manejarLogin} style={s.form}>
          <CampoConError id="usuario" errores={errores}>
            <input
              style={{ ...s.input, ...(errores.usuario ? s.inputError : {}) }}
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                clearError("usuario");
              }}
            />
          </CampoConError>

          <CampoConError id="password" errores={errores}>
            <div style={s.passwordContainer}>
            <input
              style={{ ...s.input, ...(errores.password ? s.inputError : {}) }}
              type={mostrarPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
            />
            <button type="button" style={s.verPassword}
              onClick={() => setMostrarPassword((visible) => !visible)}>
              {mostrarPassword ? "Ocultar" : "Ver"}
            </button>
            </div>
          </CampoConError>

          {errores.global && <p style={s.errorCampo}>{errores.global}</p>}

          <button
            style={{ ...s.boton, ...(bloqueado ? s.botonBloqueado : {}) }}
            type="submit"
            disabled={cargando || bloqueado}
          >
            {bloqueado ? `Espera ${tiempoRestante}s` : cargando ? "Verificando..." : "Ingresar"}
          </button>

          <p style={s.link} onClick={onRecoveryClick}>
            ¿Olvidaste tu contraseña?
          </p>
        </form>
      </div>
    </div>
  );
};

const s = {
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "11px 13px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  inputError: { borderColor: "red" },
  passwordContainer: { position: "relative", width: "100%" },
  verPassword: {
    position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
    border: "none", background: "transparent", color: "#502bc0", cursor: "pointer",
    fontSize: "12px", fontWeight: "bold",
  },
  boton: {
    padding: "12px",
    backgroundColor: "#502bc0",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
    width: "100%",
  },
  botonBloqueado: { backgroundColor: "#999", cursor: "not-allowed" },
  link: {
    color: "#502bc0",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "13px",
    textDecoration: "none",
    marginTop: "8px",
    fontWeight: "600",
  },
  errorCampo: { color: "red", fontSize: "12px", margin: 0, textAlign: "center" },
};

export default FormularioLogin;
