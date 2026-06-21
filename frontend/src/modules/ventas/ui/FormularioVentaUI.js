import React, { useEffect } from "react";
import api from "../../../core/services/api";
import { useVentaController } from "../controllers/VentaController";
import { useBoletoController } from "../controllers/BoletoController";
import MapaAsientosUI from "./MapaAsientosUI";
import VistaBoletoUI from "./VistaBoletoUI";
import HistorialBoletosUI from "./HistorialBoletosUI";

const FormularioVentaUI = () => {
  const {
    rutas,
    viajes,
    setViajes,
    cargando,
    setCargando,
    fecha,
    setFecha,
    tipos,
    vista,
    setVista,
    metodoPago,
    setMetodoPago,
    datosTarjeta,
    setDatosTarjeta,
    formData,
    setFormData,
    ticketActivo,
    setTicketActivo,
    pendienteEnvioAuto,
    setPendienteEnvioAuto,
    paypalLoaded,
    setPaypalLoaded,
    precioTotal,
    procesarCompraFinal,
    iniciarVerificacionPago,
  } = useVentaController();

  const { enviandoEmail, procesarEnvioEmail } = useBoletoController();

  // Email Modal local states
  const [mostrarEmailModal, setMostrarEmailModal] = React.useState(false);
  const [emailDestinatario, setEmailDestinatario] = React.useState("");

  // PayPal SDK button loader
  useEffect(() => {
    if (metodoPago === "paypal" && paypalLoaded && window.paypal) {
      const container = document.getElementById("paypal-button-container");
      if (container) {
        container.innerHTML = "";
      }

      window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal"
        },
        createOrder: (data, actions) => {
          const precioUSD = (precioTotal / 6.96).toFixed(2);
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: "USD",
                value: precioUSD
              },
              description: `Pasaje de Bus - Asiento #${formData.nro_asiento} (${formData.origen} a ${formData.destino})`
            }]
          });
        },
        onApprove: async (data, actions) => {
          return actions.order.capture().then(async (details) => {
            const orderId = details.id;
            setCargando(true);
            setTimeout(async () => {
              await procesarCompraFinal(orderId);
            }, 3000);
          });
        },
        onError: (err) => {
          console.error("Error en pasarela de PayPal:", err);
          alert("⚠️ Hubo un problema al procesar el pago con PayPal. Inténtalo de nuevo.");
        }
      }).render("#paypal-button-container");
    }
  }, [metodoPago, paypalLoaded, precioTotal, formData, procesarCompraFinal, setCargando]);

  // Load available seats (local hook helper)
  const [asientos, setAsientos] = React.useState([]);
  const [cargandoAsientos, setCargandoAsientos] = React.useState(false);

  const cargarAsientos = async () => {
    if (!formData.origen || !formData.destino || !formData.fecha_viaje || !formData.hora_salida) {
      alert("⚠️ Primero selecciona ruta, fecha y horario.");
      return;
    }
    setCargandoAsientos(true);
    try {
      const res = await api.get("asientos-disponibles/", {
        params: {
          origen: formData.origen,
          destino: formData.destino,
          fecha_viaje: formData.fecha_viaje,
          hora_salida: formData.hora_salida
        }
      });
      setAsientos(res.data.asientos);
    } catch (error) {
      alert("Error al cargar asientos.");
      console.error(error);
    } finally {
      setCargandoAsientos(false);
    }
  };

  const iniciarEnvioEmail = () => {
    setEmailDestinatario("");
    setMostrarEmailModal(true);
  };

  const iniciarPago = (e) => {
    e.preventDefault();
    if (!formData.nro_asiento) {
      alert("⚠️ Por favor, selecciona un asiento primero.");
      return;
    }
    setVista("pago");
  };

  return (
    <div style={styles.container}>
      {/* Botón de navegación back */}
      <div style={styles.headerNav}>
        <button
          onClick={() => {
            if (vista === "pago") {
              setVista("formulario");
            } else if (vista === "ticket") {
              setVista("formulario");
              setTicketActivo(null);
            } else if (vista === "recuperar") {
              setVista("formulario");
            } else {
              window.history.back();
            }
          }}
          style={styles.btnBack}
        >
          {vista === "pago" ? "⬅️ Volver a datos" : "🎛️ Perfiles / Inicio"}
        </button>

        {vista === "formulario" && (
          <button onClick={() => setVista("recuperar")} style={styles.btnRecuperarNav}>
            🔍 Recuperar Pasaje Perdido
          </button>
        )}
      </div>

      {/* Vista formulario de compra */}
      {vista === "formulario" && (
        <div style={styles.card}>
          <h2 style={styles.titulo}>🎟️ Venta Virtual de Pasajes</h2>
          <p style={styles.subtitulo}>Elige tu destino, selecciona tu asiento en tiempo real y obtén tu boleto al instante.</p>

          <form onSubmit={iniciarPago} style={styles.form}>
            {/* Datos del Pasajero */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>👤 Datos del Pasajero</legend>
              <div style={styles.campoGrupo}>
                <label style={styles.label}>Nombre Completo</label>
                <input
                  style={styles.input}
                  placeholder="Ej. Cristian Arcayne"
                  required
                  value={formData.nombre_pasajero}
                  onChange={(e) => setFormData({ ...formData, nombre_pasajero: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>C.I. (Carnet de Identidad)</label>
                  <input
                    style={styles.input}
                    required
                    type="number"
                    placeholder="Ej. 1234567"
                    value={formData.ci_pasajero}
                    onChange={(e) => setFormData({ ...formData, ci_pasajero: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Número de Celular</label>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="Ej. 76543210"
                    value={formData.telefono_pasajero}
                    onChange={(e) => setFormData({ ...formData, telefono_pasajero: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.campoGrupo}>
                <label style={styles.label}>Tipo de Pasajero</label>
                <select
                  style={styles.input}
                  required
                  value={formData.id_tipo}
                  onChange={(e) => setFormData({ ...formData, id_tipo: e.target.value })}
                >
                  {tipos.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>
                      {t.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            {/* Datos del Viaje */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>🗺️ Datos del Viaje</legend>
              <div style={styles.campoGrupo}>
                <label style={styles.label}>Ruta de Viaje</label>
                <select
                  style={styles.input}
                  required
                  value={formData.id_ruta || ""}
                  onChange={(e) => {
                    const ruta = rutas.find((r) => r.id_ruta === parseInt(e.target.value));
                    if (ruta) {
                      setFormData({
                        ...formData,
                        id_ruta: ruta.id_ruta,
                        origen: ruta.origen,
                        destino: ruta.destino,
                        hora_salida: "",
                        nro_asiento: "",
                      });
                      setFecha("");
                      setViajes([]);
                      setAsientos([]);
                    }
                  }}
                >
                  <option value="">Seleccione Ruta...</option>
                  {rutas.map((r) => (
                    <option key={r.id_ruta} value={r.id_ruta}>
                      {r.origen} ➔ {r.destino} (Bs. {r.precio_ruta})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Fecha del Viaje</label>
                  <input
                    style={styles.input}
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      setFormData({
                        ...formData,
                        fecha_viaje: e.target.value,
                        hora_salida: "",
                        nro_asiento: "",
                      });
                      setAsientos([]);
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Horario Disponible</label>
                  <select
                    style={styles.input}
                    required
                    value={formData.id_viaje || ""}
                    disabled={!formData.id_ruta || !fecha}
                    onChange={(e) => {
                      const v = viajes.find((x) => x.id_viaje === parseInt(e.target.value));
                      if (v) {
                        setFormData({
                          ...formData,
                          id_viaje: v.id_viaje,
                          hora_salida: v.hora,
                          placa_bus: v.placa,
                        });
                        setAsientos([]);
                      }
                    }}
                  >
                    <option value="">Seleccione Horario...</option>
                    {viajes.map((v) => (
                      <option key={v.id_viaje} value={v.id_viaje}>
                        {v.hora} — Bus {v.placa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Selección de Asiento */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>💺 Selección de Asiento</legend>
              <button
                type="button"
                onClick={cargarAsientos}
                disabled={!formData.hora_salida}
                style={{ ...styles.botonSecundario, ...(!formData.hora_salida ? styles.botonDeshabilitado : {}) }}
              >
                🔄 Visualizar Disponibilidad de Asientos
              </button>

              {cargandoAsientos ? (
                <div style={{ textAlign: "center", marginTop: 14, color: "#999" }}>Cargando asientos interactivos...</div>
              ) : asientos.length > 0 && (
                <>
                  <div style={styles.leyenda}>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#16a34a" }} /> Libre</div>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#dc2626" }} /> Ocupado</div>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#502bc0" }} /> Seleccionado</div>
                  </div>

                  <MapaAsientosUI
                    asientos={asientos}
                    nroAsientoSeleccionado={formData.nro_asiento}
                    onSelectAsiento={(nro) => setFormData({ ...formData, nro_asiento: nro })}
                  />

                  {formData.nro_asiento && (
                    <p style={styles.asientoConfirmado}>
                      🎉 Asiento Reservado: #{formData.nro_asiento}
                    </p>
                  )}
                </>
              )}
            </fieldset>

            <button type="submit" style={styles.botonPrincipal}>
              🎟️ Proceder al Pago (Bs. {precioTotal})
            </button>
          </form>
        </div>
      )}

      {/* Vista de pago seguro */}
      {vista === "pago" && (
        <div style={styles.card}>
          <h2 style={styles.titulo}>💳 Checkout de Pago Seguro</h2>
          <p style={styles.subtitulo}>Elige tu método de pago preferido para confirmar tu pasaje de bus.</p>

          <div style={styles.pagoTotalBox}>
            <span style={{ fontSize: 14, color: "#666" }}>Monto total a pagar:</span>
            <span style={styles.pagoTotalValue}>Bs. {precioTotal}</span>
          </div>

          <div style={styles.paymentTabs}>
            <button
              type="button"
              onClick={() => setMetodoPago("qr")}
              style={{ ...styles.paymentTabBtn, ...(metodoPago === "qr" ? styles.paymentTabBtnActive : {}) }}
            >
              📲 Pago con QR
            </button>
            <button
              type="button"
              onClick={() => {
                setMetodoPago("tarjeta");
                if (window.paypal) setPaypalLoaded(true);
              }}
              style={{ ...styles.paymentTabBtn, ...(metodoPago === "tarjeta" ? styles.paymentTabBtnActive : {}) }}
            >
              💳 Tarjeta Bancaria
            </button>
            <button
              type="button"
              onClick={() => {
                setMetodoPago("paypal");
                if (window.paypal) setPaypalLoaded(true);
              }}
              style={{ ...styles.paymentTabBtn, ...(metodoPago === "paypal" ? styles.paymentTabBtnActive : {}) }}
            >
              🌐 PayPal
            </button>
          </div>

          {metodoPago === "qr" && (
            <div style={styles.qrSection}>
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: "1.4", marginBottom: 14 }}>
                Escanea el siguiente código QR desde tu aplicación bancaria móvil preferida para pagar los **Bs. {precioTotal}**.
              </p>

              <div style={styles.qrImageFrame}>
                <img
                  src="/qr_banco.png"
                  alt="QR Banco de los Bolivianos"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              <div style={styles.infoAlert}>
                ℹ️ Una vez realizada la transferencia desde tu celular, presiona Verificar Pago para iniciar la conciliación segura y obtener tu boleto.
              </div>

              <button
                type="button"
                onClick={iniciarVerificacionPago}
                disabled={cargando}
                style={styles.botonPrincipal}
              >
                {cargando ? "Validando pago..." : "🛡️ Verificar Pago y Obtener Boleto"}
              </button>
            </div>
          )}

          {metodoPago === "tarjeta" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: "1.4", marginBottom: 6 }}>
                Ingresa los datos de tu tarjeta de crédito o débito de forma segura.
              </p>

              <div>
                <label style={styles.label}>NOMBRE COMPLETO DEL TITULAR</label>
                <input
                  style={styles.input}
                  placeholder="Ej. Juan Perez"
                  value={datosTarjeta.titular}
                  onChange={(e) => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>NÚMERO DE LA TARJETA</label>
                <input
                  style={styles.input}
                  maxLength="16"
                  placeholder="4000 1234 5678 9010"
                  value={datosTarjeta.numero}
                  onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>VENCIMIENTO</label>
                  <input
                    style={styles.input}
                    maxLength="5"
                    placeholder="MM/AA"
                    value={datosTarjeta.vencimiento}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, vencimiento: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>CVV (SEGURIDAD)</label>
                  <input
                    style={styles.input}
                    maxLength="4"
                    type="password"
                    placeholder="123"
                    value={datosTarjeta.cvv}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={styles.infoAlert}>
                🔒 Tus datos de pago están cifrados de extremo a extremo y no se guardan en el servidor.
              </div>

              <button
                type="button"
                onClick={iniciarVerificacionPago}
                disabled={cargando}
                style={styles.botonPrincipal}
              >
                {cargando ? "Autorizando pago..." : `🛡️ Validar Pago (Bs. ${precioTotal}) y Obtener Boleto`}
              </button>
            </div>
          )}

          {metodoPago === "paypal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: "1.4", marginBottom: 6 }}>
                Paga de forma rápida y segura con tu cuenta de **PayPal** o tarjeta de débito/crédito internacional.
              </p>
              <div style={styles.infoAlert}>
                ℹ️ Los cobros de PayPal se procesan en **Dólares Americanos (USD)**.
                Monto equivalente: **${(precioTotal / 6.96).toFixed(2)} USD** (Tipo de cambio: 1 USD = 6.96 BOB).
              </div>

              {!paypalLoaded ? (
                <div style={{ color: "#999", fontSize: 13, margin: "20px 0" }}>🔄 Cargando pasarela de PayPal...</div>
              ) : (
                <div id="paypal-button-container" style={{ width: "100%", marginTop: 10 }}></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vista de boleto de embarque */}
      {vista === "ticket" && ticketActivo && (
        <div style={styles.ticketWrapper}>
          <div style={styles.ticketActions}>
            <button onClick={iniciarEnvioEmail} style={styles.btnActionEmail} disabled={enviandoEmail}>
              {enviandoEmail ? "📧 Enviando por Correo..." : "📧 Enviar Boleto por Correo (Imagen)"}
            </button>
            <button onClick={() => window.print()} style={styles.btnActionPrint}>
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              onClick={() => {
                setVista("formulario");
                setTicketActivo(null);
              }}
              style={styles.btnActionVolver}
            >
              ⬅️ Comprar otro pasaje
            </button>
          </div>

          <VistaBoletoUI ticketActivo={ticketActivo} styles={styles} />
        </div>
      )}

      {/* Vista de recuperación de boleto */}
      {vista === "recuperar" && (
        <HistorialBoletosUI
          styles={styles}
          onSelectTicket={(p) => {
            setTicketActivo(p);
            setVista("ticket");
          }}
        />
      )}

      {/* Modal envío correo */}
      {mostrarEmailModal && (
        <div style={ms.overlay}>
          <div style={ms.modal}>
            <h3 style={{ color: "#502bc0", margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>📧 Enviar por Correo</h3>
            <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.4", marginBottom: 16 }}>
              Por favor, ingresa el correo electrónico al que quieres enviar la imagen del boleto.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); procesarEnvioEmail(emailDestinatario, ticketActivo, () => setMostrarEmailModal(false)); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="Ej: pasajero@correo.com"
                value={emailDestinatario}
                onChange={(e) => setEmailDestinatario(e.target.value)}
                required
                style={ms.input}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="submit" style={{ ...ms.btnGuardar, background: "#502bc0" }} disabled={enviandoEmail}>
                  {enviandoEmail ? "Enviando..." : "📧 Enviar Imagen"}
                </button>
                <button type="button" onClick={() => setMostrarEmailModal(false)} style={ms.btnCancelar} disabled={enviandoEmail}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "20px 10px", maxWidth: "600px", margin: "0 auto", fontFamily: "Arial, sans-serif" },
  headerNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: "8px" },
  btnBack: { border: "none", background: "#f0ebff", color: "#502bc0", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  btnRecuperarNav: { border: "none", background: "#e2e8f0", color: "#475569", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  card: { backgroundColor: "white", padding: "25px 20px", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
  titulo: { color: "#502bc0", textAlign: "center", margin: "0 0 6px 0", fontWeight: "bold" },
  subtitulo: { color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "22px", lineHeight: "1.4" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldset: { border: "1px solid #edf0f2", borderRadius: "10px", padding: "16px", background: "#fafbfc", margin: 0 },
  legend: { color: "#502bc0", fontWeight: "bold", padding: "0 8px", fontSize: "14px" },
  campoGrupo: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  label: { display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: 11, color: "#666" },
  input: {
    width: "100%", padding: "9px 11px", marginBottom: "12px",
    borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px"
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "12px" },
  botonPrincipal: {
    padding: "13px", backgroundColor: "#502bc0", color: "white",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", width: "100%"
  },
  botonSecundario: {
    padding: "9px 16px", backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "6px", fontSize: "13px", fontWeight: "bold", width: "100%"
  },
  botonDeshabilitado: { backgroundColor: "#94a3b8", cursor: "not-allowed" },
  leyenda: { display: "flex", gap: "16px", alignItems: "center", marginTop: "10px", justifyContent: "center" },
  leyendaItem: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#666" },
  punto: { display: "inline-block", width: "12px", height: "12px", borderRadius: "50%" },
  asientoConfirmado: { color: "#16a34a", fontWeight: "bold", fontSize: "13px", textAlign: "center", background: "#dcfce7", padding: 8, borderRadius: 6, border: "1px solid #bbf7d0", marginTop: 12 },
  
  pagoTotalBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px", marginBottom: 16 },
  pagoTotalValue: { fontSize: 24, fontWeight: "bold", color: "#16a34a", marginTop: 4 },
  paymentTabs: { display: "flex", gap: 8, marginBottom: 16 },
  paymentTabBtn: { flex: 1, padding: "10px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold", color: "#555", transition: "0.2s" },
  paymentTabBtnActive: { background: "#502bc0", color: "#fff", borderColor: "#502bc0" },
  qrSection: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center" },
  qrImageFrame: { width: 220, height: 220, border: "2px solid #e2e8f0", borderRadius: 10, overflow: "hidden", padding: 8, background: "#fff", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  infoAlert: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, color: "#1e40af", fontSize: 12, lineHeight: 1.4, width: "100%", boxSizing: "border-box", textAlign: "center" },

  ticketWrapper: { display: "flex", flexDirection: "column", gap: 20 },
  ticketActions: { display: "flex", flexDirection: "column", gap: 10 },
  btnActionEmail: { background: "#502bc0", color: "white", border: "none", padding: "12px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 },
  btnActionPrint: { background: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 },
  btnActionVolver: { background: "#edf0f2", color: "#333", border: "none", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  
  boardingPass: {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", overflow: "hidden"
  },
  passHeader: {
    background: "#502bc0", color: "white", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  passCompany: { display: "block", fontSize: 14, fontWeight: "bold", letterSpacing: "0.5px" },
  passSubtitle: { display: "block", fontSize: 10, opacity: 0.8, marginTop: 2 },
  passIdTitle: { display: "block", fontSize: 9, opacity: 0.8, textAlign: "right" },
  passIdValue: { display: "block", fontSize: 16, fontWeight: "bold", textAlign: "right" },
  
  passBody: { padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 },
  passRow: { display: "flex", justifyContent: "space-between", gap: 10 },
  passLabel: { display: "block", fontSize: 10, color: "#94a3b8", fontWeight: "bold", marginBottom: 2, letterSpacing: "0.3px" },
  passValue: { display: "block", fontSize: 14, color: "#1e293b", fontWeight: "500" },
  passCity: { display: "block", fontSize: 18, color: "#1e293b", fontWeight: "bold" },
  
  passDivider: { display: "flex", alignItems: "center", height: 20, position: "relative" },
  passNotchLeft: { position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: "#f4f6f8", borderRight: "1px solid #e2e8f0" },
  passNotchRight: { position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: "#f4f6f8", borderLeft: "1px solid #e2e8f0" },
  passDashedLine: { borderTop: "2px dashed #cbd5e1", width: "100%", margin: "0 10px" },
  
  passFooter: { padding: "16px 24px 20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  passPrice: { display: "block", fontSize: 20, color: "#16a34a", fontWeight: "bold" },
  
  barcodeArea: { display: "flex", flexDirection: "column", alignItems: "center", background: "#fafbfc", padding: "16px 0", borderTop: "1px solid #f1f5f9" },
  barcodeText: { fontSize: 10, color: "#64748b", marginTop: 4, fontFamily: "monospace", letterSpacing: "1px" },

  btnBuscarPublico: { background: "#502bc0", color: "white", border: "none", padding: "0 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
  recuperadoItem: { 
    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc",
    borderRadius: 8, border: "1px solid #e2e8f0", gap: 10
  },
  btnVerRecuperado: { border: "none", background: "#2563eb", color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap" }
};

const ms = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:      { background: "#fff", padding: 24, borderRadius: 12, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  input:      { width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btnGuardar: { flex: 1, padding: "10px", background: "#502bc0", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  btnCancelar:{ flex: 1, padding: "10px", background: "#eee", color: "#333", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "center" },
  label:      { fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: "bold" },
};

export default FormularioVentaUI;
