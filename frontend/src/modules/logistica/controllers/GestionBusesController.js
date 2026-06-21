import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionBusesController = (tipo) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const endpoint = tipo === "buses" ? "flotas" : "choferes";

  const cargarItems = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get(`${endpoint}/`);
      setItems(res.data);
      setFiltrados(res.data);
    } catch (err) {
      console.error(`Error al cargar ${tipo}:`, err);
    } finally {
      setCargando(false);
    }
  }, [endpoint, tipo]);

  useEffect(() => {
    cargarItems();
    setBusqueda("");
  }, [cargarItems]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(items);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      items.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(q))
      )
    );
  }, [busqueda, items]);

  const guardarItem = async (form, isEdit) => {
    try {
      const pk = tipo === "buses" ? form.placa : form.ci;
      if (isEdit) {
        await api.put(`${endpoint}/${pk}/`, form);
      } else {
        await api.post(`${endpoint}/`, form);
      }
      alert(`✅ ${tipo === "buses" ? "Bus" : "Chofer"} guardado correctamente`);
      cargarItems();
      setMostrarModal(false);
      setSeleccionado(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar registro");
    }
  };

  const eliminarItem = async (item) => {
    const pk = tipo === "buses" ? item.placa : item.ci;
    if (!window.confirm(`¿Deseas eliminar este ${tipo === "buses" ? "bus" : "chofer"}?`)) return;
    try {
      await api.delete(`${endpoint}/${pk}/`);
      alert("✅ Registro eliminado");
      cargarItems();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar. Puede estar relacionado con otras tablas.");
    }
  };

  return {
    items,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarItem,
    eliminarItem,
  };
};
