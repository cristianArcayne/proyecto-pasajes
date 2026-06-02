import React, { useState } from "react";
import api from "../api";

const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {children}
    {errores[id] && <p style={{ color: "red", fontSize: "12px", margin: 0 }}>{errores[id]}</p>}
  </div>
);

const RecuperacionContrasena = ({ onBackToLogin }) => {
  const [correoRecuperar, setCorreoRecuperar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  const setError = (campo, msg) => setErrores((prev) => ({ ...prev, [campo]: msg }));
  const clearError = (campo) => setErrores((prev) => ({ ...prev, [campo]: "" }));
  const clearAllErrors = () => {
    setErrores({});
    setMensaje("");
  };

  const manejarRecuperar = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (!correoRecuperar.trim() || !/\S+@\S+\.\S+/.test(correoRecuperar)) {
      setError("correoRecuperar", "Ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);
    try {
      await api.post("recuperar-password/", {
        correo: correoRecuperar,
      });
      setMensaje("✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      setCorreoRecuperar("");
    } catch (err) {
      setError(
        "correoRecuperar",
        err.response?.data?.mensaje || "No existe una cuenta registrada con este correo."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <h2 style={s.titulo}>🔑 Recuperar Clave</h2>
      <p style={s.subtitulo}>
        Ingresa tu correo de recuperación. Te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>

      {mensaje && <p style={s.success}>{mensaje}</p>}

      <form onSubmit={manejarRecuperar} style={s.form}>
        {!mensaje && (
          <CampoConError id="correoRecuperar" errores={errores}>
            <input
              style={s.input}
              type="email"
              placeholder="Correo Electrónico"
              value={correoRecuperar}
              onChange={(e) => {
                setCorreoRecuperar(e.target.value);
                clearError("correoRecuperar");
              }}
              required
            />
          </CampoConError>
        )}

        <button style={s.boton} type="submit" disabled={cargando || mensaje}>
          {cargando ? "Enviando..." : mensaje ? "Enviado con éxito" : "Enviar Enlace"}
        </button>

        <p style={s.link} onClick={onBackToLogin}>
          Volver al inicio de sesión
        </p>
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

export default RecuperacionContrasena;
