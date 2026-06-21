import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionPasajerosController = () => {
  const [pasajeros, setPasajeros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarPasajeros = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("clientes/");
      setPasajeros(res.data);
      setFiltrados(res.data);
    } catch (err) {
      console.error("Error al cargar pasajeros:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPasajeros();
  }, [cargarPasajeros]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(pasajeros);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      pasajeros.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          String(p.ci).includes(q) ||
          p.telefono.includes(q)
      )
    );
  }, [busqueda, pasajeros]);

  const guardarPasajero = async (form, isEdit) => {
    try {
      if (isEdit) {
        await api.put(`clientes/${form.ci}/`, form);
      } else {
        await api.post("clientes/", form);
      }
      alert("✅ Pasajero guardado correctamente");
      cargarPasajeros();
      setMostrarModal(false);
      setSeleccionado(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar el pasajero");
    }
  };

  const eliminarPasajero = async (ci) => {
    if (!window.confirm("¿Deseas eliminar este pasajero?")) return;
    try {
      await api.delete(`clientes/${ci}/`);
      alert("✅ Pasajero eliminado");
      cargarPasajeros();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al eliminar pasajero. Puede tener boletos comprados.");
    }
  };

  return {
    pasajeros,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    mostrarModal,
    setMostrarModal,
    seleccionado,
    setSeleccionado,
    guardarPasajero,
    eliminarPasajero,
  };
};
