import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

export const useVentaController = () => {
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fecha, setFecha] = useState("");
  const [tipos, setTipos] = useState([]);
  
  // Vistas: 'formulario', 'pago', 'ticket', 'recuperar'
  const [vista, setVista] = useState("formulario");

  // Método de pago: 'qr' o 'tarjeta' o 'paypal'
  const [metodoPago, setMetodoPago] = useState("qr");

  // Formulario de tarjeta bancaria
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: "",
    titular: "",
    vencimiento: "",
    cvv: ""
  });

  // Datos de compra del pasaje
  const [formData, setFormData] = useState({
    nombre_pasajero: "",
    ci_pasajero: "",
    telefono_pasajero: "",
    id_tipo: "",
    origen: "",
    destino: "",
    fecha_viaje: "",
    hora_salida: "",
    nro_asiento: "",
    requiere_factura: false
  });

  // Datos del ticket activo
  const [ticketActivo, setTicketActivo] = useState(null);
  const [pendienteEnvioAuto, setPendienteEnvioAuto] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Calcular el precio total
  const precioTotal = rutas.find(r => r.id_ruta === formData.id_ruta)?.precio_ruta || 0;

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

  const procesarCompraFinal = useCallback(async (refPayPal = null) => {
    if (metodoPago === "tarjeta") {
      if (!datosTarjeta.numero || !datosTarjeta.titular || !datosTarjeta.vencimiento || !datosTarjeta.cvv) {
        alert("⚠️ Por favor completa todos los campos de tu tarjeta bancaria.");
        return;
      }
    }

    setCargando(true);
    try {
      const res = await api.post("registrar-pasaje/", {
        ...formData,
        id_tipo: parseInt(formData.id_tipo),
        ci_pasajero: parseInt(formData.ci_pasajero),
        telefono_pasajero: formData.telefono_pasajero ? parseInt(formData.telefono_pasajero) : null,
        requiere_factura: formData.requiere_factura
      });

      const tipoPasajeroTexto = tipos.find(t => String(t.id_tipo) === String(formData.id_tipo))?.nombre_tipo || "Normal";
      const refGenerada = refPayPal || (metodoPago === "qr" ? `QR-${Math.floor(10000000 + Math.random() * 90000000)}` : `TX-${Math.floor(10000000 + Math.random() * 90000000)}`);
      
      setTicketActivo({
        id_pasaje: res.data.id_pasaje,
        nombre_pasajero: formData.nombre_pasajero,
        ci_pasajero: formData.ci_pasajero,
        telefono_pasajero: formData.telefono_pasajero,
        nro_asiento: res.data.asiento,
        placa_bus: viajes.find(v => v.id_viaje === formData.id_viaje)?.placa || formData.placa_bus || "Bus Terminal",
        precio_final: res.data.precio,
        tipo_pasajero: tipoPasajeroTexto,
        fecha: formData.fecha_viaje,
        hora: formData.hora_salida,
        origen: formData.origen,
        destino: formData.destino,
        ref_transaccion: refGenerada,
        nro_factura: res.data.nro_factura
      });

      if (formData.telefono_pasajero) {
        setPendienteEnvioAuto(true);
      }

      setFormData({
        nombre_pasajero: "",
        ci_pasajero: "",
        telefono_pasajero: "",
        id_tipo: tipos[0]?.id_tipo || "",
        origen: "",
        destino: "",
        fecha_viaje: "",
        hora_salida: "",
        nro_asiento: "",
        requiere_factura: false
      });
      setFecha("");
      setViajes([]);
      setDatosTarjeta({ numero: "", titular: "", vencimiento: "", cvv: "" });
      setVista("ticket");
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al procesar el pago y registrar tu pasaje.");
    } finally {
      setCargando(false);
    }
  }, [formData, metodoPago, datosTarjeta, tipos, viajes]);

  const iniciarVerificacionPago = () => {
    if (metodoPago === "tarjeta") {
      if (!datosTarjeta.numero || !datosTarjeta.titular || !datosTarjeta.vencimiento || !datosTarjeta.cvv) {
        alert("⚠️ Por favor completa todos los campos de tu tarjeta bancaria.");
        return;
      }
      if (datosTarjeta.numero.length < 15) {
        alert("⚠️ Por favor ingresa un número de tarjeta válido.");
        return;
      }
    }

    setCargando(true);
    setTimeout(async () => {
      await procesarCompraFinal();
    }, 3000);
  };

  return {
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
  };
};
