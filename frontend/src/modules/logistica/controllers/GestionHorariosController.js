import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionHorariosController = () => {
  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarViajes = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("viajes-admin/");
      setViajes(res.data);
      setFiltrados(res.data);
    } catch (err) {
      console.error("Error al cargar viajes:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarListasAuxiliares = useCallback(async () => {
    try {
      const resRutas = await api.get("rutas/");
      const resBuses = await api.get("flotas/");
      setRutas(resRutas.data);
      setBuses(resBuses.data);
    } catch (err) {
      console.error("Error al cargar rutas/buses auxiliares:", err);
    }
  }, []);

  useEffect(() => {
    cargarViajes();
    cargarListasAuxiliares();
  }, [cargarViajes, cargarListasAuxiliares]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(viajes);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      viajes.filter(
        (v) =>
          v.fecha.includes(q) ||
          v.hora.includes(q) ||
          v.placa.toLowerCase().includes(q) ||
          String(v.id_viaje).includes(q)
      )
    );
  }, [busqueda, viajes]);

  const guardarViaje = async (form, isEdit) => {
    try {
      if (isEdit) {
        await api.put(`viajes-admin/${form.id_viaje}/`, form);
      } else {
        await api.post("viajes-admin/", form);
      }
      alert("✅ Viaje programado correctamente");
      cargarViajes();
      setMostrarModal(false);
      setSeleccionado(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar el viaje");
    }
  };

  const eliminarViaje = async (id) => {
    if (!window.confirm("¿Deseas eliminar este viaje permanentemente?")) return;
    try {
      await api.delete(`viajes-admin/${id}/`);
      alert("✅ Viaje eliminado");
      cargarViajes();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar viaje. Puede tener pasajes vendidos.");
    }
  };

  return {
    viajes,
    rutas,
    buses,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarViaje,
    eliminarViaje,
  };
};
