import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionVentasController = () => {
  const [ventas, setVentas] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("pasajes/");
      setVentas(res.data);
      setFiltrados(res.data);
    } catch {
      console.error("Error cargando ventas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(ventas);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      ventas.filter(
        (x) =>
          x.nombre_pasajero.toLowerCase().includes(q) ||
          String(x.ci_pasajero).includes(q) ||
          String(x.nro_asiento).includes(q) ||
          String(x.placa_bus).toLowerCase().includes(q)
      )
    );
  }, [busqueda, ventas]);

  const eliminarVenta = async (id) => {
    if (!window.confirm("¿Deseas cancelar/eliminar esta venta de pasaje de forma permanente?"))
      return;
    try {
      await api.delete(`pasajes/${id}/`);
      alert("🗑️ Venta cancelada con éxito");
      cargarVentas();
    } catch {
      alert("Error al cancelar la venta.");
    }
  };

  return {
    ventas,
    filtrados,
    busqueda,
    setBusqueda,
    cargando,
    cargarVentas,
    eliminarVenta,
  };
};
