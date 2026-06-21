import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionUsuariosController = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("usuarios/");
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const eliminarUsuario = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar este trabajador?")) return;
    try {
      await api.delete(`usuarios/${userId}/eliminar/`);
      alert("✅ Usuario eliminado");
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar usuario");
    }
  };

  const desbloquearUsuario = async (userId) => {
    try {
      await api.post(`usuarios/${userId}/desbloquear/`);
      alert("✅ Usuario desbloqueado");
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al desbloquear usuario");
    }
  };

  const actualizarPermisos = async (userId, nuevosPermisos) => {
    try {
      await api.put(`usuarios/${userId}/permisos/`, { permisos: nuevosPermisos });
      alert("✅ Permisos actualizados");
      setSeleccionado(null);
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al actualizar permisos");
    }
  };

  return {
    usuarios,
    cargando,
    seleccionado,
    setSeleccionado,
    cargarUsuarios,
    eliminarUsuario,
    desbloquearUsuario,
    actualizarPermisos
  };
};
