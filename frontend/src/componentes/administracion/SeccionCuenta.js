import React, { useState, useEffect } from "react";
import api from "../../api";

const ms = {
  label: { fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: "bold" },
};

const styles = {
  formulario: {
    background: "#fff",
    padding: "30px 28px",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    maxWidth: 520,
    margin: "0 auto",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  },
  btnPrimary: {
    width: "100%",
    padding: 12,
    background: "#502bc0",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 14,
  },
};

const SeccionCuenta = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [correo, setCorreo] = useState("");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Cargar email actual al abrir
  useEffect(() => {
    api
      .get("mi-perfil/")
      .then((res) => {
        setCorreo(res.data.email || "");
      })
      .catch(console.error);
  }, []);

  const guardarCambios = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    // Si intenta cambiar la contraseña, validar requisitos
    if (newPassword) {
      if (newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Las nuevas contraseñas no coinciden.");
        return;
      }
      if (!oldPassword) {
        setError("Debes ingresar tu contraseña actual para realizar cambios.");
        return;
      }
    }

    if (!correo.trim()) {
      setError("El correo electrónico de recuperación es obligatorio.");
      return;
    }

    setCargando(true);
    try {
      const payload = { correo };
      if (newPassword) {
        payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }

      const res = await api.post("cambiar-credenciales/", payload);
      setMensaje(res.data.mensaje || "✅ Datos actualizados con éxito.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "Error al actualizar tu cuenta. Verifica tu contraseña actual."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.formulario}>
      <h2 style={{ color: "#502bc0", fontWeight: "bold", margin: "0 0 8px 0", fontSize: 20 }}>
        🔑 Configurar Cuenta
      </h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
        Cambia tu clave de seguridad o actualiza tu correo de recuperación institucional.
      </p>

      {mensaje && (
        <p
          style={{
            color: "#16a34a",
            background: "#dcfce7",
            padding: "10px",
            borderRadius: "6px",
            fontSize: "13px",
            margin: "0 0 16px 0",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {mensaje}
        </p>
      )}
      {error && (
        <p
          style={{
            color: "red",
            background: "#fee2e2",
            padding: "10px",
            borderRadius: "6px",
            fontSize: "13px",
            margin: "0 0 16px 0",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={guardarCambios} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={ms.label}>CORREO ELECTRÓNICO DE RECUPERACIÓN</label>
          <input
            type="email"
            style={styles.input}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div style={{ height: "1px", background: "#eee", margin: "8px 0" }} />
        <h4 style={{ color: "#333", fontSize: 13, margin: "0 0 4px 0", fontWeight: "bold" }}>
          🔐 Cambiar Contraseña (Opcional)
        </h4>

        <div>
          <label style={ms.label}>CONTRASEÑA ACTUAL</label>
          <input
            type="password"
            style={styles.input}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <div>
          <label style={ms.label}>NUEVA CONTRASEÑA</label>
          <input
            type="password"
            style={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <div>
          <label style={ms.label}>CONFIRMAR NUEVA CONTRASEÑA</label>
          <input
            type="password"
            style={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.btnPrimary, marginTop: 8 }}
          disabled={cargando}
        >
          {cargando ? "Guardando Cambios..." : "✅ Actualizar Configuración"}
        </button>
      </form>
    </div>
  );
};

export default SeccionCuenta;
