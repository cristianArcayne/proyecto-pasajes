import React from "react";

const CargadorVerificacion = ({ verificandoPago, pasoVerificacion, ms }) => {
  if (!verificandoPago) return null;

  return (
    <div style={ms.overlay}>
      <div
        style={{
          ...ms.modal,
          width: "420px",
          maxWidth: "90%",
          textAlign: "center",
          padding: "30px 24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "15px" }}>🛡️</div>
        <h3 style={{ color: "#502bc0", margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold" }}>
          Verificación de Pago Segura
        </h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "24px", lineHeight: "1.4" }}>
          Validando estado de fondos y conciliación con la pasarela interbancaria de{" "}
          <strong>Banco de los Bolivianos</strong>. Por favor espera.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: "left",
            background: "#f8fafc",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
          }}
        >
          {/* Paso 1: Conexión */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <span style={{ fontSize: "16px" }}>
              {pasoVerificacion >= 1 ? (pasoVerificacion > 1 ? "✅" : "🔄") : "⚪"}
            </span>
            <span
              style={{
                color:
                  pasoVerificacion === 1
                    ? "#502bc0"
                    : pasoVerificacion > 1
                    ? "#16a34a"
                    : "#94a3b8",
                fontWeight: pasoVerificacion === 1 ? "bold" : "normal",
              }}
            >
              Conectando con la red interbancaria cifrada...
            </span>
          </div>

          {/* Paso 2: Validación */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <span style={{ fontSize: "16px" }}>
              {pasoVerificacion >= 2 ? (pasoVerificacion > 2 ? "✅" : "🔄") : "⚪"}
            </span>
            <span
              style={{
                color:
                  pasoVerificacion === 2
                    ? "#502bc0"
                    : pasoVerificacion > 2
                    ? "#16a34a"
                    : "#94a3b8",
                fontWeight: pasoVerificacion === 2 ? "bold" : "normal",
              }}
            >
              Validando autenticidad del comprobante y fondos...
            </span>
          </div>

          {/* Paso 3: Acreditación */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <span style={{ fontSize: "16px" }}>
              {pasoVerificacion >= 3 ? (pasoVerificacion > 3 ? "✅" : "🔄") : "⚪"}
            </span>
            <span
              style={{
                color:
                  pasoVerificacion === 3
                    ? "#502bc0"
                    : pasoVerificacion > 3
                    ? "#16a34a"
                    : "#94a3b8",
                fontWeight: pasoVerificacion === 3 ? "bold" : "normal",
              }}
            >
              Acreditando transferencia en cuenta recaudadora...
            </span>
          </div>

          {/* Paso 4: Finalizado */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <span style={{ fontSize: "16px" }}>{pasoVerificacion >= 4 ? "🎉" : "⚪"}</span>
            <span
              style={{
                color: pasoVerificacion === 4 ? "#16a34a" : "#94a3b8",
                fontWeight: pasoVerificacion === 4 ? "bold" : "normal",
              }}
            >
              ¡Conciliación bancaria exitosa! Generando boleto...
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div
          style={{
            width: "100%",
            height: "8px",
            background: "#e2e8f0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pasoVerificacion * 25}%`,
              height: "100%",
              background: pasoVerificacion === 4 ? "#16a34a" : "#502bc0",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CargadorVerificacion;
