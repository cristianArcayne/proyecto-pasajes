import { useState } from "react";
import api from "../../../core/services/api";

export const useAsientosController = () => {
  const [asientos, setAsientos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarAsientos = async (origen, destino, fechaViaje, horaSalida) => {
    if (!origen || !destino || !fechaViaje || !horaSalida) {
      alert("⚠️ Primero selecciona ruta, fecha y horario.");
      return;
    }
    setCargando(true);
    try {
      const res = await api.get("asientos-disponibles/", {
        params: {
          origen,
          destino,
          fecha_viaje: fechaViaje,
          hora_salida: horaSalida
        }
      });
      setAsientos(res.data.asientos);
    } catch (error) {
      alert("Error al cargar asientos.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return {
    asientos,
    setAsientos,
    cargando,
    cargarAsientos,
  };
};
