import React, { useState } from "react";
import FormularioLogin from "./componentes/FormularioLogin";
import ConfiguracionPrimerIngreso from "./componentes/ConfiguracionPrimerIngreso";
import RecuperacionContrasena from "./componentes/RecuperacionContrasena";

const LoginAdmin = () => {
  const [pantalla, setPantalla] = useState("login"); // 'login', 'primer_ingreso', 'recuperar'
  const [datosLoginTemp, setDatosLoginTemp] = useState(null);

  const handleFirstTimeLogin = (datosTemp) => {
    setDatosLoginTemp(datosTemp);
    setPantalla("primer_ingreso");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {pantalla === "login" && (
          <FormularioLogin
            onFirstTimeLogin={handleFirstTimeLogin}
            onRecoveryClick={() => setPantalla("recuperar")}
          />
        )}

        {pantalla === "primer_ingreso" && (
          <ConfiguracionPrimerIngreso datosLoginTemp={datosLoginTemp} />
        )}

        {pantalla === "recuperar" && (
          <RecuperacionContrasena onBackToLogin={() => setPantalla("login")} />
        )}
      </div>
    </div>
  );
};

const s = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "360px",
  },
};

export default LoginAdmin;