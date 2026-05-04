import React, { useEffect, useState } from "react";
import axios from "axios";

const FormularioCompra = () => {
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [fecha, setFecha] = useState("");
  const [tipos, setTipos] = useState([]);

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

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/tipos-pasajero/")
      .then(res => setTipos(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/rutas/")
      .then(res => setRutas(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (formData.id_ruta && fecha) {
      axios.get("http://127.0.0.1:8000/api/viajes-disponibles/", {
        params: { id_ruta: formData.id_ruta, fecha }
      })
        .then(res => setViajes(res.data))
        .catch(err => console.error(err));
    }
  }, [formData.id_ruta, fecha]);

  const cargarAsientos = async () => {
    if (!formData.origen || !formData.destino || !formData.fecha_viaje || !formData.hora_salida) {
      alert("Primero selecciona ruta, fecha y horario.");
      return;
    }
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/asientos-disponibles/", {
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

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!formData.nro_asiento) {
      alert("Selecciona un asiento.");
      return;
    }

    setCargando(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/registrar-pasaje/", {
        ...formData,
        id_tipo: parseInt(formData.id_tipo),
        ci_pasajero: parseInt(formData.ci_pasajero),
        telefono_pasajero: formData.telefono_pasajero
          ? parseInt(formData.telefono_pasajero)
          : null
      });

      alert(`✅ Pasaje comprado! ID: ${res.data.id_pasaje} | Asiento: ${res.data.asiento} | Precio: Bs. ${res.data.precio}`);

      setFormData({
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
      setFecha("");
      setAsientos([]);
      setViajes([]);

    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al registrar pasaje.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>🎟️ Compra de Pasajes</h2>

      <form onSubmit={manejarEnvio} style={styles.form}>

        {/* ── DATOS DEL PASAJERO ── */}
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Datos del Pasajero</legend>

          <label style={styles.label}>Nombre completo</label>
          <input
            style={styles.input}
            required
            value={formData.nombre_pasajero}
            onChange={(e) => setFormData({ ...formData, nombre_pasajero: e.target.value })}
          />

          <label style={styles.label}>CI</label>
          <input
            style={styles.input}
            required
            type="number"
            value={formData.ci_pasajero}
            onChange={(e) => setFormData({ ...formData, ci_pasajero: e.target.value })}
          />

          <label style={styles.label}>Teléfono</label>
          <input
            style={styles.input}
            type="number"
            value={formData.telefono_pasajero}
            onChange={(e) => setFormData({ ...formData, telefono_pasajero: e.target.value })}
          />

          <label style={styles.label}>Tipo de pasajero</label>
          <select
            style={styles.input}
            required
            value={formData.id_tipo}
            onChange={(e) => setFormData({ ...formData, id_tipo: e.target.value })}
          >
            <option value="">Seleccione tipo</option>
            {tipos.map((t) => (
              <option key={t.id_tipo} value={t.id_tipo}>
                {t.nombre_tipo}
              </option>
            ))}
          </select>

        </fieldset> 

        {/* ── DATOS DEL VIAJE ── */}
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Datos del Viaje</legend>

          <label style={styles.label}>Ruta</label>
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
            <option value="">Seleccione ruta</option>
            {rutas.map((r) => (
              <option key={r.id_ruta} value={r.id_ruta}>
                {r.origen} → {r.destino} (Bs. {r.precio_ruta})
              </option>
            ))}
          </select>

          <label style={styles.label}>Fecha del viaje</label>
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

          <label style={styles.label}>Horario disponible</label>
          <select
            style={styles.input}
            required
            value={formData.id_viaje || ""}
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
            <option value="">Seleccione horario</option>
            {viajes.map((v) => (
              <option key={v.id_viaje} value={v.id_viaje}>
                {v.hora} — Bus {v.placa}
              </option>
            ))}
          </select>

        </fieldset> 

        {/* ── ASIENTOS ── */}
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Selección de Asiento</legend>

          <button type="button" onClick={cargarAsientos} style={styles.botonSecundario}>
            🔄 Ver asientos disponibles
          </button>

          {asientos.length > 0 && (
            <>
              <div style={styles.leyenda}>
                <span style={{ ...styles.punto, background: "green" }} /> Libre &nbsp;
                <span style={{ ...styles.punto, background: "red" }} /> Ocupado &nbsp;
                <span style={{ ...styles.punto, background: "#502bc0" }} /> Seleccionado
              </div>

              <div style={styles.grid}>
                {asientos.map((a) => (
                  <button
                    key={a.nro_asiento}
                    type="button"
                    disabled={a.ocupado}
                    onClick={() => setFormData({ ...formData, nro_asiento: a.nro_asiento })}
                    style={{
                      backgroundColor:
                        formData.nro_asiento === a.nro_asiento
                          ? "#502bc0"
                          : a.ocupado ? "red" : "green",
                      color: "white",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: a.ocupado ? "not-allowed" : "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    {a.nro_asiento}
                  </button>
                ))}
              </div>

              {formData.nro_asiento && (
                <p style={{ color: "#502bc0", fontWeight: "bold" }}>
                  ✅ Asiento seleccionado: {formData.nro_asiento}
                </p>
              )}
            </>
          )}

        </fieldset> 

        <button type="submit" disabled={cargando} style={styles.botonPrincipal}>
          {cargando ? "Procesando..." : "🎟️ Comprar Pasaje"}
        </button>

      </form>
    </div>
  );
};

const styles = {
  container: { padding: "30px", maxWidth: "600px", margin: "0 auto" },
  titulo: { color: "#502bc0", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  fieldset: { border: "1px solid #ddd", borderRadius: "8px", padding: "15px" },
  legend: { color: "#502bc0", fontWeight: "bold", padding: "0 8px" },
  label: { display: "block", marginBottom: "4px", fontWeight: "500" },
  input: {
    width: "100%", padding: "8px", marginBottom: "12px",
    borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box"
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "10px" },
  botonPrincipal: {
    padding: "12px", backgroundColor: "#502bc0", color: "white",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px"
  },
  botonSecundario: {
    padding: "8px 16px", backgroundColor: "#2980B9", color: "white",
    border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "8px"
  },
  leyenda: { display: "flex", gap: "16px", alignItems: "center", marginTop: "10px" },
  punto: { display: "inline-block", width: "14px", height: "14px", borderRadius: "50%", marginRight: "4px" }
};

export default FormularioCompra;