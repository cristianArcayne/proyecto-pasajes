import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../core/services/api";

export const useRecuperacionController = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Estados para solicitar link
  const [correoRecuperar, setCorreoRecuperar] = useState("");
  
  // Estados para restablecer con token
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // Estados comunes
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  const setErrorCampo = (campo, msg) => setErrores((prev) => ({ ...prev, [campo]: msg }));
  const clearErrorCampo = (campo) => setErrores((prev) => ({ ...prev, [campo]: "" }));

  // Enviar correo de recuperación
  const manejarSolicitudLink = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setMensaje("");
    setErrores({});

    if (!correoRecuperar.trim() || !/\S+@\S+\.\S+/.test(correoRecuperar)) {
      setErrorCampo("correoRecuperar", "Ingresa un correo electrónico válido.");
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
      setErrorCampo(
        "correoRecuperar",
        err.response?.data?.mensaje || "No existe una cuenta registrada con este correo."
      );
    } finally {
      setCargando(false);
    }
  };

  // Restablecer contraseña con token
  const manejarResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setMensaje("");

    if (!token) {
      setError("Token de recuperación no válido o inexistente.");
      return;
    }

    if (nuevaPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const res = await api.post("reset-password/", {
        token: token,
        nueva_password: nuevaPassword,
      });
      setMensaje(res.data.mensaje || "✅ Contraseña restablecida con éxito. Redirigiendo...");
      setTimeout(() => {
        navigate("/login-admin");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "Error al restablecer la contraseña. El token puede haber expirado."
      );
    } finally {
      setCargando(false);
    }
  };

  return {
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
  };
};
