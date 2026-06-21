import { useState, useEffect } from "react";
import { useAuth } from "../../../core/context/AuthContext";

export const useSesionController = () => {
  const { user, logout, tienePermiso } = useAuth();
  const [modulo, setModulo] = useState("inicio");

  useEffect(() => {
    if (modulo === "inicio" && user && user.rol !== "superusuario") {
      const posibles = ["ventas", "clientes", "buses", "choferes", "viajes"];
      const permitido = posibles.find((m) => tienePermiso(m, "ver"));
      if (permitido) setModulo(permitido);
    }
  }, [user, tienePermiso, modulo]);

  return {
    user,
    logout,
    tienePermiso,
    modulo,
    setModulo
  };
};
