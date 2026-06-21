import React from "react";
import { useEncomiendasController } from "../controllers/EncomiendasController";

const RegistroEncomiendaUI = ({ onSaved }) => {
  const {
    form,
    setForm,
    viajes,
    cargando,
    precioTotal,
    tiposPredefinidos,
    buscarClientePorCI,
    guardarEncomienda,
  } = useEncomiendasController();

  const handleCIBlur = () => {
    if (form.ci_remitente) {
      buscarClientePorCI(form.ci_remitente);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    guardarEncomienda(onSaved);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>📦 Registrar Nueva Encomienda</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>👤 Datos del Remitente</h4>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>C.I. Remitente *</label>
              <input
                type="number"
                placeholder="Ej. 7894561"
                value={form.ci_remitente}
                onChange={(e) =>
                  setForm({ ...form, ci_remitente: e.target.value })
                }
                onBlur={handleCIBlur}
                style={styles.input}
                required
              />
              <small style={styles.help}>Presiona fuera o cambia de celda para autocompletar si existe</small>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nombre Completo *</label>
              <input
                type="text"
                placeholder="Nombre del remitente"
                value={form.nombre_remitente}
                onChange={(e) =>
                  setForm({ ...form, nombre_remitente: e.target.value })
                }
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Teléfono/Celular</label>
              <input
                type="text"
                placeholder="Ej. 70012345"
                value={form.telefono_remitente}
                onChange={(e) =>
                  setForm({ ...form, telefono_remitente: e.target.value })
                }
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>📦 Detalles de la Carga</h4>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Tipo de Carga</label>
              <select
                value={form.tipo_encomienda_id}
                onChange={(e) =>
                  setForm({ ...form, tipo_encomienda_id: e.target.value })
                }
                style={styles.select}
              >
                {tiposPredefinidos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} (Base: {t.base} Bs)
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Peso en Kilogramos *</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 5.5"
                value={form.peso_kg}
                onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Viaje Asignado (Bus) *</label>
              <select
                value={form.id_viaje}
                onChange={(e) => setForm({ ...form, id_viaje: e.target.value })}
                style={styles.select}
                required
              >
                <option value="">-- Selecciona un Viaje --</option>
                {viajes.map((v) => (
                  <option key={v.id_viaje} value={v.id_viaje}>
                    {v.fecha} - {v.hora} ({v.placa}) - Ruta: {v.id_ruta}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 15 }}>
            <label style={styles.label}>Descripción del Contenido</label>
            <textarea
              placeholder="Describa el contenido de la encomienda (ej. Ropa, repuestos, caja frágil...)"
              value={form.descripcion_carga}
              onChange={(e) =>
                setForm({ ...form, descripcion_carga: e.target.value })
              }
              style={{ ...styles.input, height: 60, resize: "none" }}
            />
          </div>
        </div>

        <div style={styles.priceContainer}>
          <span style={styles.priceLabel}>Total a Pagar:</span>
          <span style={styles.priceValue}>{precioTotal} Bs</span>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={cargando ? styles.btnDisabled : styles.btnSubmit}
        >
          {cargando ? "⏳ Registrando..." : "💾 Registrar y Guardar Guía"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  card: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    marginBottom: 24,
    border: "1px solid #e2e8f0",
  },
  title: {
    margin: "0 0 20px 0",
    color: "#502bc0",
    fontWeight: "bold",
    fontSize: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  section: {
    borderBottom: "1px solid #edf2f7",
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#4a5568",
    margin: "0 0 12px 0",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  row: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  field: {
    flex: 1,
    minWidth: 200,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    background: "white",
    cursor: "pointer",
  },
  help: {
    fontSize: 11,
    color: "#94a3b8",
  },
  priceContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    background: "#f8fafd",
    padding: "12px 20px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#475569",
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10b981",
  },
  btnSubmit: {
    background: "#502bc0",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  btnDisabled: {
    background: "#94a3b8",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "bold",
    cursor: "not-allowed",
  },
};

export default RegistroEncomiendaUI;
