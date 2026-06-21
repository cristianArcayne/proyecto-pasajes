import { useState } from "react";
import api from "../../../core/services/api";

export const useConsultaBoletosController = () => {
  const [ciBusqueda, setCiBusqueda] = useState("");
  const [pasajesEncontrados, setPasajesEncontrados] = useState([]);
  const [buscandoPasajes, setBuscandoPasajes] = useState(false);

  const buscarPasajesPorCi = async (e) => {
    if (e) e.preventDefault();
    if (!ciBusqueda.trim()) {
      alert("⚠️ Ingresa tu número de carnet.");
      return;
    }

    setBuscandoPasajes(true);
    setPasajesEncontrados([]);
    try {
      const res = await api.get(`recuperar-pasaje-publico/?ci_pasajero=${ciBusqueda}`);
      setPasajesEncontrados(res.data);
      if (res.data.length === 0) {
        alert("ℹ️ No se encontraron pasajes activos para este número de C.I.");
      }
    } catch {
      alert("Error al buscar pasajes.");
    } finally {
      setBuscandoPasajes(false);
    }
  };

  return {
    ciBusqueda,
    setCiBusqueda,
    pasajesEncontrados,
    setPasajesEncontrados,
    buscandoPasajes,
    buscarPasajesPorCi,
  };
};
