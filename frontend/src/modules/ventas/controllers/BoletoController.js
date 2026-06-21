import { useState } from "react";
import api from "../../../core/services/api";

export const useBoletoController = () => {
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const cargarHtml2Canvas = () => {
    return new Promise((resolve) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  const procesarEnvioEmail = async (emailDestinatario, ticket, onFinished) => {
    if (!emailDestinatario || !ticket) return;
    setEnviandoEmail(true);

    try {
      const h2c = await cargarHtml2Canvas();
      if (!h2c) {
        alert("Error al cargar convertidor de imágenes.");
        setEnviandoEmail(false);
        return;
      }

      const ticketElement = document.getElementById("print-ticket");
      if (!ticketElement) {
        alert("Error al capturar el boleto.");
        setEnviandoEmail(false);
        return;
      }

      const canvas = await h2c(ticketElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imagenBase64 = canvas.toDataURL("image/png");

      // Enviar al backend por POST
      await api.post("pasajes/enviar-correo/", {
        email: emailDestinatario,
        imagen: imagenBase64,
        id_pasaje: ticket.id_pasaje
      });

      alert(`📧 Boleto enviado correctamente al correo: ${emailDestinatario}`);
      if (onFinished) onFinished();
      setEnviandoEmail(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.mensaje || "Error al enviar el boleto por correo.");
      setEnviandoEmail(false);
    }
  };

  return {
    enviandoEmail,
    procesarEnvioEmail,
  };
};
