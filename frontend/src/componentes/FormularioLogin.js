import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {children}
    {errores[id] && <p style={{ color: "red", fontSize: "12px", margin: 0 }}>{errores[id]}</p>}
  </div>
);

const FormularioLogin = ({ onFirstTimeLogin, onRecoveryClick }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // Bloqueo local por intentos fallidos
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  useEffect(() => {
    if (!bloqueadoHasta) return;
    const intervalo = setInterval(() => {
      const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      if (restante <= 0) {
        setBloqueadoHasta(null);
        setTiempoRestante(0);
        clearInterval(intervalo);
      } else {
        setTiempoRestante(restante);
      }
    }, 500);
    return () => clearInterval(intervalo);
  }, [bloqueadoHasta]);

  const setError = (campo, msg) => setErrores((prev) => ({ ...prev, [campo]: msg }));
  const clearError = (campo) => setErrores((prev) => ({ ...prev, [campo]: "" }));
  const clearAllErrors = () => {
    setErrores({});
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      setError("global", `Demasiados intentos. Espera ${tiempoRestante}s.`);
      return;
    }

    if (!usuario.trim() || !password) {
      if (!usuario.trim()) setError("usuario", "Requerido");
      if (!password) setError("password", "Requerido");
      return;
    }

    setCargando(true);
    try {
      const res = await api.post("login/", {
        username: usuario,
        password: password,
      });

      setIntentos(0);

      if (res.data.es_password_temporal) {
        localStorage.setItem("admin_access", res.data.access);
        onFirstTimeLogin({
          access: res.data.access,
          refresh: res.data.refresh,
          username: res.data.username,
          rol: res.data.rol,
          permisos: res.data.permisos,
          password_actual: password,
        });
      } else {
        login(res.data);
        navigate("/panel-admin");
      }
    } catch (err) {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      if (nuevosIntentos >= 3) {
        const segundos = 30;
        setBloqueadoHasta(Date.now() + segundos * 1000);
        setTiempoRestante(segundos);
      }
      setError(
        "global",
        err.response?.data?.mensaje || "Credenciales incorrectas o cuenta bloqueada."
      );
    } finally {
      setCargando(false);
    }
  };

  const bloqueado = bloqueadoHasta && Date.now() < bloqueadoHasta;

  return (
    <>
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
          <input
            style={{ ...s.input, ...(errores.password ? s.inputError : {}) }}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
          />
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
    </>
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
