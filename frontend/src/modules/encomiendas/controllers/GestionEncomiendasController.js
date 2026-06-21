import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useGestionEncomiendasController = () => {
  const [encomiendas, setEncomiendas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);

  const cargarEncomiendas = useCallback(async () => {
    setCargando(true);
    try {
      const [resEnc, resViajes] = await Promise.all([
        api.get("encomiendas/"),
        api.get("viajes-admin/"),
      ]);
      setEncomiendas(resEnc.data);
      setViajes(resViajes.data);
      setFiltrados(resEnc.data);
    } catch (err) {
      console.error("Error al cargar encomiendas:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEncomiendas();
  }, [cargarEncomiendas]);

  // Filtrado reactivo por C.I. remitente, número de guía o descripción
  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(encomiendas);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrados(
      encomiendas.filter(
        (e) =>
          String(e.nro_encomienda).includes(q) ||
          String(e.ci_remitente).includes(q) ||
          (e.descripcion_carga && e.descripcion_carga.toLowerCase().includes(q))
      )
    );
  }, [busqueda, encomiendas]);

  const eliminarEncomienda = async (nro) => {
    if (!window.confirm(`¿Deseas anular / eliminar la encomienda Nro ${nro}?`)) return;
    try {
      await api.delete(`encomiendas/${nro}/`);
      alert("✅ Encomienda anulada con éxito");
      cargarEncomiendas();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al anular la encomienda");
    }
  };

  const getDetallesViaje = (idViaje) => {
    const v = viajes.find((x) => x.id_viaje === idViaje);
    return v ? `${v.fecha} - ${v.hora} (${v.placa})` : `Viaje #${idViaje}`;
  };

  return {
    encomiendas,
    viajes,
    cargando,
    busqueda,
    setBusqueda,
    filtrados,
    cargarEncomiendas,
    eliminarEncomienda,
    getDetallesViaje,
  };
};
