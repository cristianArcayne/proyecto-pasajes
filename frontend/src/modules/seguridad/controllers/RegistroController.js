import { useState } from "react";
import api from "../../../core/services/api";

export const useRegistroController = ({ onGuardado } = {}) => {
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [permisos, setPermisos] = useState({
    clientes: { ver: false, crear: false, modificar: false, eliminar: false },
    buses: { ver: false, crear: false, modificar: false, eliminar: false },
    choferes: { ver: false, crear: false, modificar: false, eliminar: false },
    viajes: { ver: false, crear: false, modificar: false, eliminar: false },
    ventas: { ver: false, crear: false, modificar: false, eliminar: false },
    encomiendas: { ver: false, crear: false, modificar: false, eliminar: false },
    reportes: { ver: false },
    bitacora: { ver: false },
  });
  const [cargando, setCargando] = useState(false);

  const manejarPermiso = (modulo, accion) =>
    setPermisos((prev) => ({
      ...prev,
      [modulo]: { ...prev[modulo], [accion]: !prev[modulo][accion] },
    }));

  const guardarUsuario = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
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
        encomiendas: { ver: false, crear: false, modificar: false, eliminar: false },
        reportes: { ver: false },
        bitacora: { ver: false },
      });
      if (onGuardado) onGuardado();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al crear usuario");
    } finally {
      setCargando(false);
    }
  };

  return {
    form,
    setForm,
    permisos,
    setPermisos,
    cargando,
    manejarPermiso,
    guardarUsuario,
  };
};
