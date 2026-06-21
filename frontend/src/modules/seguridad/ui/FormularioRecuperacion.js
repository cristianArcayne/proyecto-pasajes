import React from "react";
import { useRecuperacionController } from "../controllers/RecuperacionController";

const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {children}
    {errores[id] && <p style={{ color: "red", fontSize: "12px", margin: 0 }}>{errores[id]}</p>}
  </div>
);

const FormularioRecuperacion = ({ onBackToLogin }) => {
  const {
    token,
    correoRecuperar,
    setCorreoRecuperar,
    nuevaPassword,
    setNuevaPassword,
    confirmarPassword,
    setConfirmarPassword,
    cargando,
    mensaje,
    error,
    errores,
    clearErrorCampo,
    manejarSolicitudLink,
    manejarResetPassword,
  } = useRecuperacionController();

  if (token) {
    // Modo: Restablecer Contraseña (token presente)
    return (
      <div style={token ? {} : s.page}>
        <h2 style={s.titulo}>🔑 Restablecer Contraseña</h2>
        <p style={s.subtitulo}>Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
        
        {mensaje && <p style={s.success}>{mensaje}</p>}
        {error && <p style={s.error}>{error}</p>}

        {!mensaje && (
          <form onSubmit={manejarResetPassword} style={s.form}>
            <input
              style={s.input}
              type="password"
              placeholder="Nueva Contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
            />
            <input
              style={s.input}
              type="password"
              placeholder="Confirmar Nueva Contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />
            <button style={s.boton} type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Modo: Solicitar Link de Recuperación (token ausente)
  return (
    <>
      <h2 style={s.titulo}>🔑 Recuperar Clave</h2>
      <p style={s.subtitulo}>
        Ingresa tu correo de recuperación. Te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>

      {mensaje && <p style={s.success}>{mensaje}</p>}

      <form onSubmit={manejarSolicitudLink} style={s.form}>
        {!mensaje && (
          <CampoConError id="correoRecuperar" errores={errores}>
            <input
              style={s.input}
              type="email"
              placeholder="Correo Electrónico"
              value={correoRecuperar}
              onChange={(e) => {
                setCorreoRecuperar(e.target.value);
                clearErrorCampo("correoRecuperar");
              }}
              required
            />
          </CampoConError>
        )}

        <button style={s.boton} type="submit" disabled={cargando || mensaje}>
          {cargando ? "Enviando..." : mensaje ? "Enviado con éxito" : "Enviar Enlace"}
        </button>

        {onBackToLogin && (
          <p style={s.link} onClick={onBackToLogin}>
            Volver al inicio de sesión
          </p>
        )}
      </form>
    </>
  );
};

const s = {
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px", fontWeight: "bold" },
  subtitulo: { color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "20px", lineHeight: "1.4" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "11px 13px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
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
    marginTop: "10px"
  },
  link: {
    color: "#502bc0",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "13px",
    textDecoration: "none",
    marginTop: "8px",
    fontWeight: "600",
  },
  error: { color: "red", fontSize: "13px", margin: "0 0 16px 0", textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' },
  success: {
    color: "#16a34a",
    fontSize: "13px",
    textAlign: "center",
    backgroundColor: "#dcfce7",
    padding: "10px",
    borderRadius: "6px",
    margin: "0 0 16px 0",
  },
};

export default FormularioRecuperacion;
