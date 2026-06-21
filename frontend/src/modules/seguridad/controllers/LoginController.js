import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/context/AuthContext";
import api from "../../../core/services/api";

export const useLoginController = ({ onFirstTimeLogin, onRecoveryClick }) => {
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
  const clearAllErrors = () => setErrores({});

  const manejarLogin = async (e) => {
    if (e) e.preventDefault();
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

  return {
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
  };
};
