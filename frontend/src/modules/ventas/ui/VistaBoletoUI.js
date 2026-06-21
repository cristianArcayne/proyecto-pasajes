import React from "react";

const VistaBoletoUI = ({ ticketActivo, styles }) => {
  if (!ticketActivo) return null;

  return (
    <div id="print-ticket" style={styles.boardingPass}>
      {/* Cabecera del Boleto */}
      <div style={styles.passHeader}>
        <div>
          <span style={styles.passCompany}>🚏 FLOTA TRANS CHACO</span>
          <span style={styles.passSubtitle}>BOLETO ELECTRÓNICO DE ABORDAJE</span>
        </div>
        <div>
          <span style={styles.passIdTitle}>NRO BOLETO</span>
          <span style={styles.passIdValue}>#{ticketActivo.id_pasaje}</span>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={styles.passBody}>
        <div style={styles.passRow}>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>PASAJERO</span>
            <span style={styles.passValue}>{ticketActivo.nombre_pasajero}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>C.I.</span>
            <span style={styles.passValue}>{ticketActivo.ci_pasajero}</span>
          </div>
        </div>

        <div style={styles.passRow}>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>ORIGEN</span>
            <span style={styles.passCity}>{ticketActivo.origen}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 10px",
              color: "#502bc0",
              fontSize: "20px",
            }}
          >
            ➔
          </div>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>DESTINO</span>
            <span style={styles.passCity}>{ticketActivo.destino}</span>
          </div>
        </div>

        <div style={styles.passRow}>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>FECHA VIAJE</span>
            <span style={styles.passValue}>{ticketActivo.fecha}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>HORA SALIDA</span>
            <span style={styles.passValue}>{ticketActivo.hora}</span>
          </div>
        </div>

        <div style={styles.passRow}>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>BUS PLACA</span>
            <span style={styles.passValue}>{ticketActivo.placa_bus}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={styles.passLabel}>ASIENTO</span>
            <span
              style={{
                ...styles.passValue,
                color: "#502bc0",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              #{ticketActivo.nro_asiento}
            </span>
          </div>
        </div>
      </div>

      {/* Separador físico de ticket con corte */}
      <div style={styles.passDivider}>
        <span style={styles.passNotchLeft} />
        <div style={styles.passDashedLine} />
        <span style={styles.passNotchRight} />
      </div>

      {/* Pie / Recibo de Pago */}
      <div style={styles.passFooter}>
        <div>
          <span style={styles.passLabel}>TIPO TARIFA</span>
          <span style={styles.passValue}>{ticketActivo.tipo_pasajero}</span>
        </div>
        {ticketActivo.ref_transaccion && (
          <div style={{ textAlign: "center" }}>
            <span style={styles.passLabel}>REF. PAGO</span>
            <span
              style={{
                ...styles.passValue,
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              {ticketActivo.ref_transaccion}
            </span>
          </div>
        )}
        <div style={{ textAlign: "right" }}>
          <span style={styles.passLabel}>TOTAL PAGADO</span>
          <span style={styles.passPrice}>Bs. {ticketActivo.precio_final}</span>
        </div>
      </div>

      {/* Código QR de Validación Único */}
      <div style={styles.barcodeArea}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
            `🎫 ID BOLETO: #${ticketActivo.id_pasaje}\n` +
              `👤 PASAJERO: ${ticketActivo.nombre_pasajero}\n` +
              `💺 ASIENTO: #${ticketActivo.nro_asiento}\n` +
              `🗺️ RUTA: ${ticketActivo.origen} a ${ticketActivo.destino}\n` +
              `📅 FECHA: ${ticketActivo.fecha} | ${ticketActivo.hora}\n` +
              `💵 MONTO: Bs. ${ticketActivo.precio_final}\n` +
              `🛡️ REF PAGO: ${ticketActivo.ref_transaccion || "EFECTIVO"}`
          )}`}
          alt="Código QR de Validación de Embarque"
          style={{
            width: "115px",
            height: "115px",
            marginBottom: "8px",
            border: "1px solid #e2e8f0",
            padding: "6px",
            borderRadius: "8px",
            background: "#fff",
            display: "block",
            margin: "0 auto 8px auto",
          }}
        />
        <span style={styles.barcodeText}>
          * BOLETO ELECTRÓNICO VÁLIDO #{ticketActivo.id_pasaje} *
        </span>
        <span
          style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", fontWeight: "bold" }}
        >
          Escanea para validar el embarque en terminal
        </span>
      </div>
    </div>
  );
};

export default VistaBoletoUI;
