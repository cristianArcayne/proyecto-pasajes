import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionRutasController = () => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarRutas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("rutas/");
      setRutas(res.data);
      setFiltrados(res.data);
    } catch (err) {
      console.error("Error al cargar rutas:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(rutas);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      rutas.filter(
        (r) =>
          r.origen.toLowerCase().includes(q) ||
          r.destino.toLowerCase().includes(q) ||
          String(r.precio_ruta).includes(q)
      )
    );
  }, [busqueda, rutas]);

  const guardarRuta = async (form, isEdit) => {
    try {
      if (isEdit) {
        await api.put(`rutas/${form.id_ruta}/`, form);
      } else {
        await api.post("rutas/", form);
      }
      alert("✅ Ruta guardada correctamente");
      cargarRutas();
      setMostrarModal(false);
      setSeleccionado(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar ruta");
    }
  };

  const eliminarRuta = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta ruta permanentemente?")) return;
    try {
      await api.delete(`rutas/${id}/`);
      alert("✅ Ruta eliminada");
      cargarRutas();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar ruta. Puede estar relacionada con viajes.");
    }
  };

  return {
    rutas,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarRuta,
    eliminarRuta,
  };
};
