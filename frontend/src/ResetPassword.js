import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from './api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const manejarReset = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!token) {
      setError('Token de recuperación no válido o inexistente.');
      return;
    }

    if (nuevaPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const res = await api.post('reset-password/', {
        token: token,
        nueva_password: nuevaPassword,
      });
      setMensaje(res.data.mensaje || '✅ Contraseña restablecida con éxito. Redirigiendo...');
      setTimeout(() => {
        navigate('/login-admin');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al restablecer la contraseña. El token puede haber expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.titulo}>🔑 Reestablecer Contraseña</h2>
        <p style={s.subtitulo}>Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
        
        {mensaje && <p style={s.success}>{mensaje}</p>}
        {error && <p style={s.error}>{error}</p>}

        {!mensaje && (
          <form onSubmit={manejarReset} style={s.form}>
            <input
              style={s.input}
              type="password"
              placeholder="Nueva Contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
            />
            <input
              style={s.input}
              type="password"
              placeholder="Confirmar Nueva Contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />
            <button style={s.boton} type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Reestablecer Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const s = {
  page: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f2f5" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "360px" },
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px" },
  subtitulo: { color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "20px", lineHeight: "1.4" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "11px 13px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", width: "100%", boxSizing: "border-box" },
  boton: { padding: "12px", backgroundColor: "#502bc0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold", marginTop: "10px" },
  error: { color: "red", fontSize: "13px", margin: "0 0 16px 0", textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' },
  success: { color: "#16a34a", fontSize: "13px", margin: "0 0 16px 0", textAlign: 'center', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px' },
};

export default ResetPassword;
