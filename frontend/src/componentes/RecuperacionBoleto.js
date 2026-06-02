import React, { useState } from "react";
import api from "../api";

const RecuperacionBoleto = ({ styles, onSelectTicket }) => {
  const [ciBusqueda, setCiBusqueda] = useState("");
  const [pasajesEncontrados, setPasajesEncontrados] = useState([]);
  const [buscandoPasajes, setBuscandoPasajes] = useState(false);

  const buscarPasajesPorCi = async (e) => {
    e.preventDefault();
    if (!ciBusqueda.trim()) {
      alert("⚠️ Ingresa tu número de carnet.");
      return;
    }

    setBuscandoPasajes(true);
    setPasajesEncontrados([]);
    try {
      const res = await api.get(`recuperar-pasaje-publico/?ci_pasajero=${ciBusqueda}`);
      setPasajesEncontrados(res.data);
      if (res.data.length === 0) {
        alert("ℹ️ No se encontraron pasajes activos para este número de C.I.");
      }
    } catch {
      alert("Error al buscar pasajes.");
    } finally {
      setBuscandoPasajes(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.titulo}>🔍 Recuperar Boleto Perdido</h2>
      <p style={styles.subtitulo}>
        Ingresa tu número de Carnet de Identidad (C.I.) para buscar tus pasajes recientes y volver a
        ver tu recibo.
      </p>

      <form onSubmit={buscarPasajesPorCi} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          style={{ ...styles.input, margin: 0 }}
          required
          type="number"
          placeholder="Escribe tu número de C.I."
          value={ciBusqueda}
          onChange={(e) => setCiBusqueda(e.target.value)}
        />
        <button type="submit" disabled={buscandoPasajes} style={styles.btnBuscarPublico}>
          {buscandoPasajes ? "Buscar..." : "Buscar"}
        </button>
      </form>

      {pasajesEncontrados.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "14px", color: "#555", fontWeight: "bold", margin: "0 0 4px 0" }}>
            Boleto(s) Encontrado(s):
          </h3>
          {pasajesEncontrados.map((p) => (
            <div key={p.id_pasaje} style={styles.recuperadoItem}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>
                  Boleto #{p.id_pasaje} ➔ {p.origen} a {p.destino}
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginTop: 4 }}>
                  📅 {p.fecha} | ⏰ {p.hora} | 💺 Asiento: #{p.nro_asiento}
                </div>
                <div style={{ fontSize: "12px", color: "#999", marginTop: 2 }}>
                  Pasajero: {p.nombre_pasajero} | C.I. {p.ci_pasajero}
                </div>
              </div>
              <button
                onClick={() => onSelectTicket(p)}
                style={styles.btnVerRecuperado}
              >
                👁️ Ver Boleto
              </button>
            </div>
          ))}
        </div>
      ) : (
        !buscandoPasajes &&
        ciBusqueda && (
          <p style={{ textAlign: "center", color: "#999", fontSize: "13px", marginTop: 20 }}>
            No se encontraron registros para tu C.I.
          </p>
        )
      )}
    </div>
  );
};

export default RecuperacionBoleto;
