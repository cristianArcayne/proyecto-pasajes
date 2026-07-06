import React, { useEffect, useRef, useState } from "react";
import { consultarAsistenteIA } from "../controllers/AsistenteIAController";

const PanelAsistenteIAUI = () => {
  const [consulta, setConsulta] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const reconocimientoRef = useRef(null);
  const vozRef = useRef(null);

  useEffect(() => () => {
    reconocimientoRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const escucharConsulta = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tu navegador no admite el reconocimiento de voz. Prueba con Google Chrome o Microsoft Edge.");
      return;
    }
    window.speechSynthesis?.cancel();
    const reconocimiento = new SpeechRecognition();
    reconocimiento.lang = "es-BO";
    reconocimiento.interimResults = false;
    reconocimiento.continuous = false;
    reconocimiento.onstart = () => { setEscuchando(true); setError(""); };
    reconocimiento.onresult = (event) => {
      const textoReconocido = event.results[0][0].transcript.trim();
      setConsulta(textoReconocido);
      procesarConsulta(textoReconocido);
    };
    reconocimiento.onerror = (event) => {
      if (event.error === "no-speech") {
        setError("No escuché ninguna voz. Acércate al micrófono y vuelve a intentarlo.");
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("El micrófono está bloqueado. Permite su uso desde el candado de la barra de direcciones.");
      } else if (event.error !== "aborted") {
        setError("No pude usar el micrófono. Comprueba que no esté ocupado por otra aplicación.");
      }
    };
    reconocimiento.onend = () => setEscuchando(false);
    reconocimientoRef.current = reconocimiento;
    reconocimiento.start();
  };

  const detenerEscucha = () => reconocimientoRef.current?.stop();

  const leerRespuesta = (texto) => {
    if (!window.speechSynthesis) {
      setError("Tu navegador no admite lectura de voz.");
      return;
    }
    window.speechSynthesis.cancel();
    const mensaje = new SpeechSynthesisUtterance(texto);
    const voces = window.speechSynthesis.getVoices();
    mensaje.voice = voces.find((voz) => voz.lang === "es-BO") ||
      voces.find((voz) => voz.lang.startsWith("es")) || null;
    mensaje.lang = mensaje.voice?.lang || "es-BO";
    mensaje.rate = 0.95;
    mensaje.volume = 1;
    mensaje.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") {
        setError("No se pudo reproducir la voz. Revisa que el navegador y el equipo tengan sonido.");
      }
    };
    vozRef.current = mensaje;
    // Chrome puede ignorar una reproducción iniciada inmediatamente después de cancelarla.
    window.setTimeout(() => window.speechSynthesis.speak(mensaje), 120);
  };

  const exportarExcel = () => {
    const tabla = resultado?.tabla;
    if (!tabla?.filas?.length) return;
    const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const contenido = [
      tabla.columnas.map((columna) => escapar(columna.etiqueta)).join(","),
      ...tabla.filas.map((fila) => tabla.columnas.map((columna) => escapar(fila[columna.clave])).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff", contenido], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `${tabla.titulo.replace(/\s+/g, "_")}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  };

  const exportarPDF = () => {
    const tabla = resultado?.tabla;
    if (!tabla?.filas?.length) return;
    const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[caracter]);
    const encabezado = tabla.columnas.map((c) => `<th>${escapar(c.etiqueta)}</th>`).join("");
    const filas = tabla.filas.map((fila) => `<tr>${tabla.columnas
      .map((c) => `<td>${escapar(fila[c.clave])}</td>`).join("")}</tr>`).join("");
    const ventana = window.open("", "_blank", "width=1000,height=700");
    if (!ventana) return setError("Permite las ventanas emergentes para exportar el PDF.");
    ventana.document.write(`<!doctype html><html><head><title>${escapar(tabla.titulo)}</title>
      <style>body{font-family:Arial;padding:30px;color:#1e293b}h1{color:#502bc0;font-size:24px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
      th{background:#502bc0;color:white}@media print{button{display:none}}</style></head><body>
      <h1>${escapar(tabla.titulo)}</h1><table><thead><tr>${encabezado}</tr></thead>
      <tbody>${filas}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
    ventana.document.close();
  };
  const procesarConsulta = async (texto) => {
    if (!texto) {
      setError("Escribe o di una consulta antes de continuar.");
      return;
    }
    setCargando(true); setError("");
    try {
      const respuesta = await consultarAsistenteIA(texto);
      setResultado(respuesta);
      leerRespuesta(respuesta.respuesta);
    }
    catch (err) { setError(err.response?.data?.consulta?.[0] || err.response?.data?.detail ||
      "No fue posible consultar al asistente. Inténtalo nuevamente."); }
    finally { setCargando(false); }
  };

  const enviar = (event) => {
    event.preventDefault();
    procesarConsulta(consulta.trim());
  };
  return <div style={s.container}>
    <div style={s.header}><div style={s.icon}>IA</div><div>
      <h2 style={s.title}>Asistente Virtual IA Administrativo</h2>
      <p style={s.subtitle}>Consulta información de clientes y reportes del sistema.</p>
    </div></div>
    <form onSubmit={enviar} style={s.card}>
      <label htmlFor="consulta-ia" style={s.label}>¿Qué información necesitas?</label>
      <textarea id="consulta-ia" value={consulta} onChange={e => setConsulta(e.target.value)}
        placeholder="Ej.: Busca el cliente con CI 1234567" rows={5} disabled={cargando} style={s.textarea}/>
      <div style={s.voiceRow}>
        <button type="button" onClick={escuchando ? detenerEscucha : escucharConsulta}
          disabled={cargando} style={{...s.voiceButton, ...(escuchando ? s.listening : {})}}>
          {escuchando ? "Detener micrófono" : "Hablar por micrófono"}
        </button>
        {escuchando && <span style={s.listeningText}>Escuchando tu consulta…</span>}
      </div>
      <div style={s.examples}>Habla y el asistente buscará automáticamente. Prueba: “Muéstrame los reportes de ventas”, “Lista los clientes” o “Busca el cliente con CI 1234567”.</div>
      <button disabled={cargando} style={{...s.button, opacity: cargando ? .65 : 1}}>
        {cargando ? "Consultando..." : "Consultar"}</button>
    </form>
    {error && <div role="alert" style={s.error}>{error}</div>}
    {resultado && <section aria-live="polite" style={s.response}>
      <strong style={{color: "#502bc0"}}>Respuesta del asistente</strong>
      {!resultado.tabla && <p style={{lineHeight: 1.7}}>{resultado.respuesta}</p>}
      <div style={s.responseActions}>
        <button type="button" onClick={() => leerRespuesta(resultado.respuesta)} style={s.readButton}>
          Escuchar respuesta
        </button>
        <button type="button" onClick={() => window.speechSynthesis?.cancel()} style={s.stopButton}>
          Detener voz
        </button>
      </div>
      <small style={{color: "#64748b"}}>Tipo de consulta: {resultado.tipoConsulta}</small>
      {resultado.tabla && <div style={s.tableSection}>
        <div style={s.tableHeader}>
          <h3 style={s.tableTitle}>{resultado.tabla.titulo}</h3>
          <div style={s.exportActions}>
            <button type="button" onClick={exportarPDF} style={s.pdfButton}>Exportar PDF</button>
            <button type="button" onClick={exportarExcel} style={s.excelButton}>Exportar Excel</button>
          </div>
        </div>
        <div style={s.tableScroll}>
          <table style={s.table}>
            <thead><tr>{resultado.tabla.columnas.map((columna) =>
              <th key={columna.clave} style={s.th}>{columna.etiqueta}</th>)}</tr></thead>
            <tbody>{resultado.tabla.filas.length ? resultado.tabla.filas.map((fila, indice) =>
              <tr key={indice}>{resultado.tabla.columnas.map((columna) =>
                <td key={columna.clave} style={s.td}>{String(fila[columna.clave] ?? "")}</td>)}</tr>) :
              <tr><td colSpan={resultado.tabla.columnas.length} style={s.empty}>Sin registros</td></tr>}</tbody>
          </table>
        </div>
      </div>}
    </section>}
  </div>;
};

const s = {
  container: {maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif"},
  header: {display: "flex", gap: 16, alignItems: "center", marginBottom: 24},
  icon: {width: 56, height: 56, borderRadius: 16, background: "#502bc0", color: "white", display: "grid", placeItems: "center", fontWeight: "bold"},
  title: {margin: 0, color: "#1e293b"}, subtitle: {margin: "6px 0 0", color: "#64748b"},
  card: {background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,.06)"},
  label: {display: "block", marginBottom: 10, color: "#334155", fontWeight: "bold"},
  textarea: {width: "100%", boxSizing: "border-box", resize: "vertical", padding: 14, border: "1px solid #cbd5e1", borderRadius: 9, font: "inherit", outlineColor: "#502bc0"},
  voiceRow: {display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap"},
  voiceButton: {background: "#ede9fe", color: "#502bc0", border: "1px solid #c4b5fd", borderRadius: 8, padding: "9px 14px", fontWeight: "bold", cursor: "pointer"},
  listening: {background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5"},
  listeningText: {color: "#b91c1c", fontSize: 13, fontWeight: "bold"},
  examples: {marginTop: 8, color: "#64748b", fontSize: 12},
  button: {marginTop: 18, background: "#502bc0", color: "white", border: 0, borderRadius: 8, padding: "11px 24px", fontWeight: "bold", cursor: "pointer"},
  error: {marginTop: 18, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, color: "#b91c1c"},
  response: {marginTop: 20, padding: 24, background: "#f8f7ff", border: "1px solid #ddd6fe", borderRadius: 14},
  responseActions: {display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap"},
  readButton: {background: "#502bc0", color: "white", border: 0, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontWeight: "bold"},
  stopButton: {background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 7, padding: "8px 12px", cursor: "pointer"},
  tableSection: {marginTop: 22}, tableHeader: {display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap"},
  tableTitle: {margin: 0, color: "#1e293b"}, exportActions: {display: "flex", gap: 8},
  pdfButton: {background: "#dc2626", color: "white", border: 0, borderRadius: 7, padding: "9px 13px", cursor: "pointer", fontWeight: "bold"},
  excelButton: {background: "#059669", color: "white", border: 0, borderRadius: 7, padding: "9px 13px", cursor: "pointer", fontWeight: "bold"},
  tableScroll: {overflowX: "auto", marginTop: 12, background: "white", borderRadius: 8},
  table: {width: "100%", borderCollapse: "collapse", fontSize: 13},
  th: {background: "#502bc0", color: "white", padding: 10, textAlign: "left", whiteSpace: "nowrap"},
  td: {padding: 10, borderBottom: "1px solid #e2e8f0", color: "#334155"},
  empty: {padding: 20, textAlign: "center", color: "#64748b"}
};
export default PanelAsistenteIAUI;
