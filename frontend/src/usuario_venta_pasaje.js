import React, { useEffect, useState } from "react";
import api from "./api";

const FormularioCompra = () => {
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fecha, setFecha] = useState("");
  const [tipos, setTipos] = useState([]);
  
  // Vistas: 'formulario', 'pago', 'ticket', 'recuperar'
  const [vista, setVista] = useState('formulario');

  // Método de pago: 'qr' o 'tarjeta'
  const [metodoPago, setMetodoPago] = useState('qr');

  // Formulario de tarjeta bancaria
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: ''
  });

  // Datos de compra
  const [formData, setFormData] = useState({
    nombre_pasajero: "",
    ci_pasajero: "",
    telefono_pasajero: "",
    id_tipo: "",
    origen: "",
    destino: "",
    fecha_viaje: "",
    hora_salida: "",
    nro_asiento: ""
  });

  // Datos del ticket comprado/seleccionado
  const [ticketActivo, setTicketActivo] = useState(null);

  // Datos de búsqueda/recuperación
  const [ciBusqueda, setCiBusqueda] = useState('');
  const [pasajesEncontrados, setPasajesEncontrados] = useState([]);
  const [buscandoPasajes, setBuscandoPasajes] = useState(false);

  // WhatsApp Modal
  const [mostrarWaModal, setMostrarWaModal] = useState(false);
  const [telefonoWa, setTelefonoWa] = useState('');
  const [compartiendoWa, setCompartiendoWa] = useState(false);
  const [pendienteEnvioAuto, setPendienteEnvioAuto] = useState(false);

  useEffect(() => {
    api.get("tipos-pasajero/")
      .then(res => {
        setTipos(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, id_tipo: res.data[0].id_tipo }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    api.get("rutas/")
      .then(res => setRutas(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (formData.id_ruta && fecha) {
      api.get("viajes-disponibles/", {
        params: { id_ruta: formData.id_ruta, fecha }
      })
        .then(res => setViajes(res.data))
        .catch(err => console.error(err));
    }
  }, [formData.id_ruta, fecha]);

  useEffect(() => {
    if (vista === 'ticket' && ticketActivo && pendienteEnvioAuto) {
      setPendienteEnvioAuto(false);
      if (ticketActivo.telefono_pasajero) {
        const timer = setTimeout(() => {
          procesarEnvioWhatsapp(ticketActivo.telefono_pasajero, ticketActivo);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [vista, ticketActivo, pendienteEnvioAuto]);

  const cargarAsientos = async () => {
    if (!formData.origen || !formData.destino || !formData.fecha_viaje || !formData.hora_salida) {
      alert("⚠️ Primero selecciona ruta, fecha y horario.");
      return;
    }
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
    }
  };

  // Carga dinámica de html2canvas para renderizar HTML a Imagen PNG
  const cargarHtml2Canvas = () => {
    return new Promise((resolve) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  // 1. Primer Paso: El usuario envía los datos de reserva
  const iniciarPago = (e) => {
    e.preventDefault();

    if (!formData.nro_asiento) {
      alert("⚠️ Por favor, selecciona un asiento primero.");
      return;
    }

    // Pasamos a la vista de pago
    setVista('pago');
  };

  // 2. Segundo Paso: El usuario confirma el pago (se realiza la compra)
  const procesarCompraFinal = async () => {
    // Validar tarjeta si ese es el método elegido
    if (metodoPago === 'tarjeta') {
      if (!datosTarjeta.numero || !datosTarjeta.titular || !datosTarjeta.vencimiento || !datosTarjeta.cvv) {
        alert('⚠️ Por favor completa todos los campos de tu tarjeta bancaria.');
        return;
      }
    }

    setCargando(true);
    try {
      // Registrar el pasaje en el backend (se guarda en la base de datos de Render)
      const res = await api.post("registrar-pasaje/", {
        ...formData,
        id_tipo: parseInt(formData.id_tipo),
        ci_pasajero: parseInt(formData.ci_pasajero),
        telefono_pasajero: formData.telefono_pasajero ? parseInt(formData.telefono_pasajero) : null
      });

      // Crear objeto ticket activo para visualizar
      const tipoPasajeroTexto = tipos.find(t => String(t.id_tipo) === String(formData.id_tipo))?.nombre_tipo || 'Normal';
      setTicketActivo({
        id_pasaje: res.data.id_pasaje,
        nombre_pasajero: formData.nombre_pasajero,
        ci_pasajero: formData.ci_pasajero,
        telefono_pasajero: formData.telefono_pasajero,
        nro_asiento: res.data.asiento,
        placa_bus: viajes.find(v => v.id_viaje === formData.id_viaje)?.placa || formData.placa_bus || 'Bus Terminal',
        precio_final: res.data.precio,
        tipo_pasajero: tipoPasajeroTexto,
        fecha: formData.fecha_viaje,
        hora: formData.hora_salida,
        origen: formData.origen,
        destino: formData.destino,
      });

      // Activar el envío automático de WhatsApp si se registró un celular
      if (formData.telefono_pasajero) {
        setPendienteEnvioAuto(true);
      }

      // Limpiar formulario y estados
      setFormData({
        nombre_pasajero: "",
        ci_pasajero: "",
        telefono_pasajero: "",
        id_tipo: tipos[0]?.id_tipo || "",
        origen: "",
        destino: "",
        fecha_viaje: "",
        hora_salida: "",
        nro_asiento: ""
      });
      setFecha("");
      setAsientos([]);
      setViajes([]);
      setDatosTarjeta({ numero: '', titular: '', vencimiento: '', cvv: '' });

      // Avanzar a la vista de Boleto
      setVista('ticket');
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al procesar el pago y registrar tu pasaje.");
    } finally {
      setCargando(false);
    }
  };

  // Buscar pasajes por CI
  const buscarPasajesPorCi = async (e) => {
    e.preventDefault();
    if (!ciBusqueda.trim()) {
      alert('⚠️ Ingresa tu número de carnet.');
      return;
    }

    setBuscandoPasajes(true);
    setPasajesEncontrados([]);
    try {
      const res = await api.get(`recuperar-pasaje-publico/?ci_pasajero=${ciBusqueda}`);
      setPasajesEncontrados(res.data);
      if (res.data.length === 0) {
        alert('ℹ️ No se encontraron pasajes activos para este número de C.I.');
      }
    } catch {
      alert('Error al buscar pasajes.');
    } finally {
      setBuscandoPasajes(false);
    }
  };

  // Función principal para gatillar el flujo de WhatsApp
  const iniciarEnvioWhatsapp = async () => {
    if (ticketActivo.telefono_pasajero) {
      // ✅ Si ya tiene un teléfono registrado, ejecutamos el envío directamente e instantáneamente
      await procesarEnvioWhatsapp(ticketActivo.telefono_pasajero);
    } else {
      // Si no tiene teléfono registrado (porque era opcional), abrimos el modal para pedirlo
      setTelefonoWa('');
      setMostrarWaModal(true);
    }
  };

  // Convertir Boleto a Imagen PNG y compartir por WhatsApp
  const procesarEnvioWhatsapp = async (numeroDestinatario, ticketOpcional = null) => {
    const ticket = ticketOpcional || ticketActivo;
    if (!numeroDestinatario || !ticket) return;
    setCompartiendoWa(true);

    try {
      // 1. Cargar la librería html2canvas dinámicamente
      const h2c = await cargarHtml2Canvas();
      if (!h2c) {
        alert('Error al cargar convertidor de imágenes.');
        setCompartiendoWa(false);
        return;
      }

      // Obtener el elemento del ticket
      const ticketElement = document.getElementById('print-ticket');
      if (!ticketElement) {
        alert('Error al capturar el boleto.');
        setCompartiendoWa(false);
        return;
      }

      // 2. Renderizar el HTML del boleto en una imagen (Canvas)
      const canvas = await h2c(ticketElement, {
        scale: 2, // Calidad retina
        useCORS: true, // Admitir imágenes externas
        backgroundColor: '#ffffff'
      });

      // Convertir a blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Error al generar la imagen del boleto.');
          setCompartiendoWa(false);
          return;
        }

        const file = new File([blob], `Boleto-Embarque-${ticket.id_pasaje}.png`, { type: 'image/png' });
        const numeroFormateado = String(numeroDestinatario).startsWith('591') ? numeroDestinatario : `591${numeroDestinatario}`;
        
        // Texto de acompañamiento para el envío
        const mensajeTexto = `*🚌 BOLETO DE EMBARQUE VIRTUAL DETALLADO*\n` +
          `🎫 ID Pasaje: #${ticket.id_pasaje}\n` +
          `👤 Pasajero: ${ticket.nombre_pasajero}\n` +
          `💺 Asiento: #${ticket.nro_asiento}\n` +
          `🗺️ Ruta: ${ticket.origen} ➔ ${ticket.destino}`;

        // 3. INTENTO A: Compartir Archivo mediante Web Share API NATIVA (Ideal para Celulares y Tablets)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Boleto ID #${ticket.id_pasaje}`,
              text: mensajeTexto,
            });
            setMostrarWaModal(false);
            setCompartiendoWa(false);
            return; // Compartido con éxito nativamente
          } catch (shareErr) {
            console.log('Share cancelado o no admitido:', shareErr);
          }
        }

        // 4. INTENTO B: Portapapeles (Clipboard API) + Redirección a WhatsApp (Ideal para computadoras / PC / WhatsApp Web)
        // Escribe la imagen generada directamente en la memoria del portapapeles del sistema
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert(
              `📋 ¡Imagen del Boleto copiada con éxito al portapapeles del sistema!\n\n` +
              `Te redirigiremos automáticamente al chat de WhatsApp del número ${numeroDestinatario}.\n` +
              `Cuando se abra la conversación, simplemente presiona:\n` +
              `➔ Ctrl + V (en Windows/Mac)\n` +
              `➔ Pegar (manteniendo presionado en tu celular)\n\n` +
              `¡Y la imagen física del boleto se adjuntará y enviará al instante!`
            );
            
            const url = `https://api.whatsapp.com/send?phone=${numeroFormateado}&text=${encodeURIComponent(mensajeTexto)}`;
            window.open(url, '_blank');
            setMostrarWaModal(false);
            setCompartiendoWa(false);
            return;
          } catch (clipErr) {
            console.error('Error al escribir en portapapeles:', clipErr);
          }
        }

        // 5. INTENTO C: Descarga Directa de la Imagen + Redirección a WhatsApp (Fallback de ultra-seguridad)
        // Descarga el archivo de imagen automáticamente y abre el chat para adjuntarlo manualmente
        const link = document.createElement('a');
        link.download = `Boleto-Embarque-${ticket.id_pasaje}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        alert(
          `📥 Tu boleto se ha descargado como imagen automáticamente.\n\n` +
          `Ahora abriremos el chat de WhatsApp. Por favor adjunta el archivo descargado para enviárselo a tu destinatario.`
        );

        const url = `https://api.whatsapp.com/send?phone=${numeroFormateado}&text=${encodeURIComponent(mensajeTexto)}`;
        window.open(url, '_blank');
        setMostrarWaModal(false);
        setCompartiendoWa(false);

      }, 'image/png');

    } catch (err) {
      console.error(err);
      alert('Error inesperado al intentar compartir la imagen.');
      setCompartiendoWa(false);
    }
  };

  const precioTotal = rutas.find(r => r.id_ruta === formData.id_ruta)?.precio_ruta || 0;

  return (
    <div style={styles.container}>
      
      {/* BOTÓN BACK / NAVEGACIÓN EN CABECERA */}
      <div style={styles.headerNav}>
        <button 
          onClick={() => {
            if (vista === 'pago') {
              setVista('formulario');
            } else if (vista === 'ticket') {
              setVista('formulario');
              setTicketActivo(null);
            } else if (vista === 'recuperar') {
              setVista('formulario');
              setPasajesEncontrados([]);
              setCiBusqueda('');
            } else {
              window.history.back();
            }
          }}
          style={styles.btnBack}
        >
          {vista === 'pago' ? '⬅️ Volver a datos' : '🎛️ Perfiles / Inicio'}
        </button>

        {vista === 'formulario' && (
          <button onClick={() => setVista('recuperar')} style={styles.btnRecuperarNav}>
            🔍 Recuperar Pasaje Perdido
          </button>
        )}
      </div>

      {/* ── VISTA 1: FORMULARIO DE COMPRA ── */}
      {vista === 'formulario' && (
        <div style={styles.card}>
          <h2 style={styles.titulo}>🎟️ Venta Virtual de Pasajes</h2>
          <p style={styles.subtitulo}>Elige tu destino, selecciona tu asiento en tiempo real y obtén tu boleto al instante.</p>

          <form onSubmit={iniciarPago} style={styles.form}>
            {/* DATOS DEL PASAJERO */}
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

            {/* DATOS DEL VIAJE */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>🗺️ Datos del Viaje</legend>
              <div style={styles.campoGrupo}>
                <label style={styles.label}>Ruta de Viaje</label>
                <select
                  style={styles.input}
                  required
                  value={formData.id_ruta || ""}
                  onChange={(e) => {
                    const ruta = rutas.find(r => r.id_ruta === parseInt(e.target.value));
                    if (ruta) {
                      setFormData({
                        ...formData,
                        id_ruta: ruta.id_ruta,
                        origen: ruta.origen,
                        destino: ruta.destino,
                        hora_salida: "",
                        nro_asiento: ""
                      });
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
                        nro_asiento: ""
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
                      const v = viajes.find(v => v.id_viaje === parseInt(e.target.value));
                      if (v) {
                        setFormData({
                          ...formData,
                          id_viaje: v.id_viaje,
                          hora_salida: v.hora
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

            {/* SELECCIÓN DE ASIENTO */}
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

              {asientos.length > 0 && (
                <>
                  <div style={styles.leyenda}>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#16a34a" }} /> Libre</div>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#dc2626" }} /> Ocupado</div>
                    <div style={styles.leyendaItem}><span style={{ ...styles.punto, background: "#502bc0" }} /> Seleccionado</div>
                  </div>

                  <div style={styles.grid}>
                    {asientos.map((a) => {
                      const isSelected = formData.nro_asiento === a.nro_asiento;
                      const bg = a.ocupado ? "#fee2e2" : isSelected ? "#502bc0" : "#dcfce7";
                      const col = a.ocupado ? "#dc2626" : isSelected ? "#fff" : "#16a34a";
                      const border = a.ocupado ? "1px solid #fecaca" : isSelected ? "1px solid #502bc0" : "1px solid #bbf7d0";
                      
                      return (
                        <button
                          key={a.nro_asiento}
                          type="button"
                          disabled={a.ocupado}
                          onClick={() => setFormData({ ...formData, nro_asiento: a.nro_asiento })}
                          style={{
                            backgroundColor: bg,
                            color: col,
                            border: border,
                            padding: "10px 0",
                            borderRadius: "6px",
                            cursor: a.ocupado ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                            transition: "0.2s"
                          }}
                        >
                          {a.nro_asiento}
                        </button>
                      );
                    })}
                  </div>

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

      {/* ── VISTA: PROCESADOR DE PAGO SEGURO (QR O TARJETA) ── */}
      {vista === 'pago' && (
        <div style={styles.card}>
          <h2 style={styles.titulo}>💳 Checkout de Pago Seguro</h2>
          <p style={styles.subtitulo}>Elige tu método de pago preferido para confirmar tu pasaje de bus.</p>

          <div style={styles.pagoTotalBox}>
            <span style={{ fontSize: 14, color: '#666' }}>Monto total a pagar:</span>
            <span style={styles.pagoTotalValue}>Bs. {precioTotal}</span>
          </div>

          {/* Pestañas método de pago */}
          <div style={styles.paymentTabs}>
            <button 
              type="button" 
              onClick={() => setMetodoPago('qr')} 
              style={{ ...styles.paymentTabBtn, ...(metodoPago === 'qr' ? styles.paymentTabBtnActive : {}) }}
            >
              📲 Pago con QR
            </button>
            <button 
              type="button" 
              onClick={() => setMetodoPago('tarjeta')} 
              style={{ ...styles.paymentTabBtn, ...(metodoPago === 'tarjeta' ? styles.paymentTabBtnActive : {}) }}
            >
              💳 Tarjeta Bancaria
            </button>
          </div>

          {/* CONTENIDO TIPO DE PAGO: QR */}
          {metodoPago === 'qr' && (
            <div style={styles.qrSection}>
              <p style={{ fontSize: 13, color: '#555', textAlign: 'center', lineHeight: '1.4', marginBottom: 14 }}>
                Escanea el siguiente código QR desde tu aplicación bancaria móvil preferida para pagar los **Bs. {precioTotal}**.
              </p>
              
              <div style={styles.qrImageFrame}>
                <img 
                  src="/qr_banco.png" 
                  alt="QR Banco de los Bolivianos" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              </div>

              <div style={styles.infoAlert}>
                ℹ️ Una vez realizada la transferencia bancaria en tu celular, haz clic en el botón de confirmación abajo para generar tu boleto.
              </div>

              <button 
                type="button" 
                onClick={procesarCompraFinal} 
                disabled={cargando}
                style={styles.botonPrincipal}
              >
                {cargando ? "Confirmando transferencia..." : "✅ Ya realicé mi pago / Confirmar"}
              </button>
            </div>
          )}

          {/* CONTENIDO TIPO DE PAGO: TARJETA */}
          {metodoPago === 'tarjeta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: '#555', textAlign: 'center', lineHeight: '1.4', marginBottom: 6 }}>
                Ingresa los datos de tu tarjeta de crédito o débito de forma segura.
              </p>

              <div>
                <label style={styles.label}>NOMBRE COMPLETO DEL TITULAR</label>
                <input 
                  style={styles.input} 
                  placeholder="Ej. Juan Perez" 
                  value={datosTarjeta.titular} 
                  onChange={e => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value })}
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
                  onChange={e => setDatosTarjeta({ ...datosTarjeta, numero: e.target.value })}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>VENCIMIENTO</label>
                  <input 
                    style={styles.input} 
                    maxLength="5"
                    placeholder="MM/AA" 
                    value={datosTarjeta.vencimiento} 
                    onChange={e => setDatosTarjeta({ ...datosTarjeta, vencimiento: e.target.value })}
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
                    onChange={e => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div style={styles.infoAlert}>
                🔒 Tus datos de pago están cifrados de extremo a extremo y no se guardan en el servidor.
              </div>

              <button 
                type="button" 
                onClick={procesarCompraFinal} 
                disabled={cargando}
                style={styles.botonPrincipal}
              >
                {cargando ? "Autorizando pago bancario..." : `💳 Pagar Bs. ${precioTotal} y Obtener Boleto`}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── VISTA 3: VER RECIBO / PASAJE DE ABORDO PREMIUM ── */}
      {vista === 'ticket' && ticketActivo && (
        <div style={styles.ticketWrapper}>
          
          {/* BOTONES ACCION BOLETO */}
          <div style={styles.ticketActions}>
            <button 
              onClick={iniciarEnvioWhatsapp}
              style={styles.btnActionWhatsapp}
            >
              💬 Enviar Boleto por WhatsApp (Imagen)
            </button>
            <button 
              onClick={() => window.print()}
              style={styles.btnActionPrint}
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button 
              onClick={() => {
                setVista('formulario');
                setTicketActivo(null);
              }}
              style={styles.btnActionVolver}
            >
              ⬅️ Comprar otro pasaje
            </button>
          </div>

          {/* DISEÑO BOLETO EMBARQUE */}
          <div id="print-ticket" style={styles.boardingPass}>
            {/* Cabecera */}
            <div style={styles.passHeader}>
              <div style={{ textAlign: 'left' }}>
                <span style={styles.passCompany}>TERMINAL METROPOLITANA</span>
                <span style={styles.passSubtitle}>BOLETO DE EMBARQUE VIRTUAL</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.passIdTitle}>BOLETO ID</span>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', color: '#502bc0', fontSize: '20px' }}>
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
                  <span style={{ ...styles.passValue, color: '#502bc0', fontWeight: 'bold', fontSize: '18px' }}>#{ticketActivo.nro_asiento}</span>
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
              <div style={{ textAlign: 'right' }}>
                <span style={styles.passLabel}>TOTAL PAGADO</span>
                <span style={styles.passPrice}>Bs. {ticketActivo.precio_final}</span>
              </div>
            </div>

            {/* Código de barra estético */}
            <div style={styles.barcodeArea}>
              <div style={styles.barcodeLines} />
              <span style={styles.barcodeText}>*TICKET-{ticketActivo.id_pasaje}*</span>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 4: BUSCADOR DE PASAJES PERDIDOS ── */}
      {vista === 'recuperar' && (
        <div style={styles.card}>
          <h2 style={styles.titulo}>🔍 Recuperar Boleto Perdido</h2>
          <p style={styles.subtitulo}>Ingresa tu número de Carnet de Identidad (C.I.) para buscar tus pasajes recientes y volver a ver tu recibo.</p>

          <form onSubmit={buscarPasajesPorCi} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              style={{ ...styles.input, margin: 0 }}
              required
              type="number"
              placeholder="Escribe tu número de C.I."
              value={ciBusqueda}
              onChange={e => setCiBusqueda(e.target.value)}
            />
            <button type="submit" disabled={buscandoPasajes} style={styles.btnBuscarPublico}>
              {buscandoPasajes ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {pasajesEncontrados.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', color: '#555', fontWeight: 'bold', margin: '0 0 4px 0' }}>Boleto(s) Encontrado(s):</h3>
              {pasajesEncontrados.map((p) => (
                <div key={p.id_pasaje} style={styles.recuperadoItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>
                      Boleto #{p.id_pasaje} ➔ {p.origen} a {p.destino}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: 4 }}>
                      📅 {p.fecha} | ⏰ {p.hora} | 💺 Asiento: #{p.nro_asiento}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
                      Pasajero: {p.nombre_pasajero} | C.I. {p.ci_pasajero}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setTicketActivo(p);
                      setVista('ticket');
                    }}
                    style={styles.btnVerRecuperado}
                  >
                    👁️ Ver Boleto
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !buscandoPasajes && ciBusqueda && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: 20 }}>No se encontraron registros para tu C.I.</p>
            )
          )}
        </div>
      )}

      {/* ── MODAL: ENVIAR WHATSAPP (FALLBACK SOLO SI NO REGISTRÓ CELULAR AL COMPRAR) ── */}
      {mostrarWaModal && (
        <div style={ms.overlay}>
          <div style={ms.modal}>
            <h3 style={{ color: '#16a34a', margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>💬 Compartir por WhatsApp</h3>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: 16 }}>
              No registraste un celular al comprar. Por favor, ingresa el número de teléfono al que quieres enviar la imagen del boleto.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); procesarEnvioWhatsapp(telefonoWa); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="number"
                placeholder="Ej: 76543210 (Bolivia)"
                value={telefonoWa}
                onChange={e => setTelefonoWa(e.target.value)}
                required
                style={ms.input}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={{ ...ms.btnGuardar, background: '#16a34a' }} disabled={compartiendoWa}>
                  {compartiendoWa ? 'Generando Imagen...' : '💬 Compartir Imagen'}
                </button>
                <button type="button" onClick={() => setMostrarWaModal(false)} style={ms.btnCancelar} disabled={compartiendoWa}>
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
  headerNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  btnBack: { border: 'none', background: '#f0ebff', color: '#502bc0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  btnRecuperarNav: { border: 'none', background: '#e2e8f0', color: '#475569', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  card: { backgroundColor: "white", padding: "25px 20px", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
  titulo: { color: "#502bc0", textAlign: "center", margin: "0 0 6px 0", fontWeight: "bold" },
  subtitulo: { color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "22px", lineHeight: "1.4" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldset: { border: "1px solid #edf0f2", borderRadius: "10px", padding: "16px", background: "#fafbfc", margin: 0 },
  legend: { color: "#502bc0", fontWeight: "bold", padding: "0 8px", fontSize: "14px" },
  campoGrupo: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  label: { display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: 11, color: '#666' },
  input: {
    width: "100%", padding: "9px 11px", marginBottom: "12px",
    borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px"
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "12px" },
  botonPrincipal: {
    padding: "13px", backgroundColor: "#502bc0", color: "white",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: 'bold', width: '100%'
  },
  botonSecundario: {
    padding: "9px 16px", backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "6px", fontSize: '13px', fontWeight: 'bold', width: '100%'
  },
  botonDeshabilitado: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
  leyenda: { display: "flex", gap: "16px", alignItems: "center", marginTop: "10px", justifyContent: 'center' },
  leyendaItem: { display: "flex", alignItems: "center", gap: "4px", fontSize: '12px', color: '#666' },
  punto: { display: "inline-block", width: "12px", height: "12px", borderRadius: "50%" },
  asientoConfirmado: { color: "#16a34a", fontWeight: "bold", fontSize: '13px', textAlign: 'center', background: '#dcfce7', padding: 8, borderRadius: 6, border: '1px solid #bbf7d0', marginTop: 12 },
  
  // PAGO STYLES
  pagoTotalBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px', marginBottom: 16 },
  pagoTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  paymentTabs: { display: 'flex', gap: 8, marginBottom: 16 },
  paymentTabBtn: { flex: 1, padding: '10px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold', color: '#555', transition: '0.2s' },
  paymentTabBtnActive: { background: '#502bc0', color: '#fff', borderColor: '#502bc0' },
  qrSection: { display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' },
  qrImageFrame: { width: 220, height: 220, border: '2px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', padding: 8, background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  infoAlert: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, color: '#1e40af', fontSize: 12, lineHeight: 1.4, width: '100%', boxSizing: 'border-box', textAlign: 'center' },

  // TICKET WRAPPER STYLES
  ticketWrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  ticketActions: { display: 'flex', flexDirection: 'column', gap: 10 },
  btnActionWhatsapp: { background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 },
  btnActionPrint: { background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 },
  btnActionVolver: { background: '#edf0f2', color: '#333', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  
  // DISEÑO RECIBO BOLETO EMBARQUE
  boardingPass: {
    background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  passHeader: {
    background: '#502bc0', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  passCompany: { display: 'block', fontSize: 14, fontWeight: 'bold', letterSpacing: '0.5px' },
  passSubtitle: { display: 'block', fontSize: 10, opacity: 0.8, marginTop: 2 },
  passIdTitle: { display: 'block', fontSize: 9, opacity: 0.8, textAlign: 'right' },
  passIdValue: { display: 'block', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  
  passBody: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  passRow: { display: 'flex', justifyContent: 'space-between', gap: 10 },
  passLabel: { display: 'block', fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginBottom: 2, letterSpacing: '0.3px' },
  passValue: { display: 'block', fontSize: 14, color: '#1e293b', fontWeight: '500' },
  passCity: { display: 'block', fontSize: 18, color: '#1e293b', fontWeight: 'bold' },
  
  passDivider: { display: 'flex', alignItems: 'center', height: 20, position: 'relative' },
  passNotchLeft: { position: 'absolute', left: -10, width: 20, height: 20, borderRadius: '50%', background: '#f4f6f8', borderRight: '1px solid #e2e8f0' },
  passNotchRight: { position: 'absolute', right: -10, width: 20, height: 20, borderRadius: '50%', background: '#f4f6f8', borderLeft: '1px solid #e2e8f0' },
  passDashedLine: { borderTop: '2px dashed #cbd5e1', width: '100%', margin: '0 10px' },
  
  passFooter: { padding: '16px 24px 20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  passPrice: { display: 'block', fontSize: 20, color: '#16a34a', fontWeight: 'bold' },
  
  barcodeArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fafbfc', padding: '16px 0', borderTop: '1px solid #f1f5f9' },
  barcodeLines: { 
    width: '180px', height: '40px', background: 'repeating-linear-gradient(90deg, #1e293b 0px, #1e293b 2px, transparent 2px, transparent 6px, #1e293b 6px, #1e293b 10px)'
  },
  barcodeText: { fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'monospace', letterSpacing: '1px' },

  // VISTA RECUPERADO
  btnBuscarPublico: { background: '#502bc0', color: 'white', border: 'none', padding: '0 20px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' },
  recuperadoItem: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc',
    borderRadius: 8, border: '1px solid #e2e8f0', gap: 10
  },
  btnVerRecuperado: { border: 'none', background: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }
};

const ms = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', padding: 24, borderRadius: 12, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  input:      { width: '100%', padding: '9px 11px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  btnGuardar: { flex: 1, padding: '10px', background: '#502bc0', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  btnCancelar:{ flex: 1, padding: '10px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'center' },
  label:      { fontSize: 11, color: '#666', display: 'block', marginBottom: 4, fontWeight: 'bold' },
};

export default FormularioCompra;