import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {children}
    {errores[id] && <p style={{ color: "red", fontSize: "12px", margin: 0 }}>{errores[id]}</p>}
  </div>
);

const ReqItem = ({ ok, texto }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: ok ? "#16a34a" : "#888",
      fontSize: "12px",
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: ok ? "#16a34a" : "#ccc",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
    {texto}
  </div>
);

const ConfiguracionPrimerIngreso = ({ datosLoginTemp }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  const setError = (campo, msg) => setErrores((prev) => ({ ...prev, [campo]: msg }));
  const clearError = (campo) => setErrores((prev) => ({ ...prev, [campo]: "" }));
  const clearAllErrors = () => setErrores({});

  const req = {
    largo: nuevaPassword.length >= 8,
    letra: /[a-zA-Z]/.test(nuevaPassword),
    numero: /[0-9]/.test(nuevaPassword),
  };

  const manejarPrimerIngreso = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (!req.largo || !req.letra || !req.numero) {
      setError("nuevaPassword", "La contraseña no cumple con los requisitos mínimos de seguridad.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("confirmarPassword", "Las contraseñas no coinciden.");
      return;
    }

    if (!correo.trim() || !/\S+@\S+\.\S+/.test(correo)) {
      setError("correo", "Ingresa un correo electrónico de recuperación válido.");
      return;
    }

    setCargando(true);
    try {
      await api.post("cambiar-credenciales/", {
        old_password: datosLoginTemp.password_actual,
        new_password: nuevaPassword,
        correo: correo,
      });

      login({
        access: datosLoginTemp.access,
        refresh: datosLoginTemp.refresh,
        username: datosLoginTemp.username,
        rol: datosLoginTemp.rol,
        permisos: datosLoginTemp.permisos,
      });
      navigate("/panel-admin");
    } catch (err) {
      setError("global", err.response?.data?.mensaje || "Error al configurar la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <h2 style={s.titulo}>⚙️ Configurar Cuenta</h2>
      <p style={s.subtitulo}>
        Debes configurar tu nueva contraseña de seguridad y un correo electrónico de recuperación para
        continuar.
      </p>

      <form onSubmit={manejarPrimerIngreso} style={s.form}>
        <CampoConError id="nuevaPassword" errores={errores}>
          <input
            style={s.input}
            type="password"
            placeholder="Nueva Contraseña"
            value={nuevaPassword}
            onChange={(e) => {
              setNuevaPassword(e.target.value);
              clearError("nuevaPassword");
            }}
          />
        </CampoConError>

        <div style={s.requisitos}>
          <ReqItem ok={req.largo} texto="Mínimo 8 caracteres" />
          <ReqItem ok={req.letra} texto="Al menos una letra" />
          <ReqItem ok={req.numero} texto="Al menos un número" />
        </div>

        <CampoConError id="confirmarPassword" errores={errores}>
          <input
            style={s.input}
            type="password"
            placeholder="Confirmar Contraseña"
            value={confirmarPassword}
            onChange={(e) => {
              setConfirmarPassword(e.target.value);
              clearError("confirmarPassword");
            }}
          />
        </CampoConError>

        <CampoConError id="correo" errores={errores}>
          <input
            style={s.input}
            type="email"
            placeholder="Correo de Recuperación"
            value={correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              clearError("correo");
            }}
          />
        </CampoConError>

        {errores.global && <p style={s.errorCampo}>{errores.global}</p>}

        <button style={s.boton} type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar y Continuar"}
        </button>
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
  errorCampo: { color: "red", fontSize: "12px", margin: 0, textAlign: "center" },
  requisitos: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "6px 8px",
    background: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #eee",
  },
};

export default ConfiguracionPrimerIngreso;
