import { useState, useEffect } from "react";
import api from "../../../core/services/api";

export const useConsultaController = () => {
  const [rutas, setRutas] = useState([]);
  const [viajesDisponibles, setViajesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .get("rutas/")
      .then((res) => setRutas(res.data))
      .catch((err) => console.error("Error al cargar rutas de consulta:", err));
  }, []);

  const consultarHorarios = async (idRuta, fecha) => {
    if (!idRuta || !fecha) {
      setViajesDisponibles([]);
      return;
    }
    setCargando(true);
    try {
      const res = await api.get("viajes-disponibles/", {
        params: { id_ruta: idRuta, fecha },
      });
      setViajesDisponibles(res.data);
    } catch (err) {
      console.error("Error al consultar viajes disponibles:", err);
      alert("Error al cargar viajes disponibles.");
    } finally {
      setCargando(false);
    }
  };

  return {
    rutas,
    viajesDisponibles,
    setViajesDisponibles,
    cargando,
    consultarHorarios,
  };
};
