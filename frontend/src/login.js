import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // ✅ IMPORTADO

// Componentes auxiliares (CampoConError y ReqItem se mantienen igual)
const CampoConError = ({ id, errores, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    {children}
    {errores[id] && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errores[id]}</p>}
  </div>
);

const ReqItem = ({ ok, texto }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ok ? '#16a34a' : '#888', fontSize: '12px' }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#16a34a' : '#ccc', display: 'inline-block', flexShrink: 0 }} />
    {texto}
  </div>
);

const LoginAdmin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ USAMOS EL CONTEXTO
  const [pantalla, setPantalla] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [tokenTemporal, setTokenTemporal] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [correo, setCorreo] = useState('');
  const [correoRecuperar, setCorreoRecuperar] = useState('');
  const [tokenReset, setTokenReset] = useState('');
  const [passwordReset, setPasswordReset] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // --- Bloqueo por intentos fallidos ---
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  useEffect(() => {
    if (!bloqueadoHasta) return;
    const intervalo = setInterval(() => {
      const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      if (restante <= 0) {
        setBloqueadoHasta(null);
        setTiempoRestante(0);
        clearInterval(intervalo);
      } else {
        setTiempoRestante(restante);
      }
    }, 500);
    return () => clearInterval(intervalo);
  }, [bloqueadoHasta]);

  const setError = (campo, msg) => setErrores(prev => ({ ...prev, [campo]: msg }));
  const clearError = (campo) => setErrores(prev => ({ ...prev, [campo]: '' }));
  const clearAllErrors = () => setErrores({});

  const req = {
    largo: nuevaPassword.length >= 8,
    letra: /[a-zA-Z]/.test(nuevaPassword),
    numero: /[0-9]/.test(nuevaPassword),
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      setError('global', `Demasiados intentos. Espera ${tiempoRestante}s.`);
      return;
    }

    if (!usuario.trim() || !password) {
      if (!usuario.trim()) setError('usuario', 'Requerido');
      if (!password) setError('password', 'Requerido');
      return;
    }

    setCargando(true);
    try {
      // ✅ IMPORTANTE: Cambié la URL a la que usa tu Backend (Usuarios/views.py)
      const res = await axios.post("http://127.0.0.1:8000/api/login/", {
        username: usuario,
        password: password,
      });

      setIntentos(0);

      // ✅ SI ES CONTRASEÑA TEMPORAL
      if (res.data.es_password_temporal) {
        setTokenTemporal(res.data.access);
        setPantalla('primer_ingreso');
      } else {
        // ✅ SI ES LOGIN NORMAL: Usamos la función login del contexto
        login(res.data); 
        navigate('/panel-admin');
      }
    } catch (err) {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      if (nuevosIntentos >= 3) {
        const segundos = 30;
        setBloqueadoHasta(Date.now() + segundos * 1000);
        setTiempoRestante(segundos);
      }
      setError('global', err.response?.data?.mensaje || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  // ... (Las funciones manejarPrimerIngreso, manejarRecuperar y manejarReset se mantienen igual)
  // Pero asegúrate de que al final de manejarReset o primer ingreso también uses login() si es necesario.

  const bloqueado = bloqueadoHasta && Date.now() < bloqueadoHasta;

  return (
    <div style={s.page}>
      <div style={s.card}>
        {pantalla === 'login' && (
          <>
            <h2 style={s.titulo}>🔐 Acceso Administrativo</h2>
            <form onSubmit={manejarLogin} style={s.form}>
              <CampoConError id="usuario" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.usuario ? s.inputError : {}) }}
                  type="text" placeholder="Usuario" value={usuario}
                  onChange={(e) => { setUsuario(e.target.value); clearError('usuario'); }}
                />
              </CampoConError>
              <CampoConError id="password" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.password ? s.inputError : {}) }}
                  type="password" placeholder="Contraseña" value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                />
              </CampoConError>
              {errores.global && <p style={s.errorCampo}>{errores.global}</p>}
              <button style={{ ...s.boton, ...(bloqueado ? s.botonBloqueado : {}) }} type="submit" disabled={cargando || bloqueado}>
                {bloqueado ? `Espera ${tiempoRestante}s` : cargando ? "Verificando..." : "Ingresar"}
              </button>
              <p style={s.link} onClick={() => { setPantalla('recuperar'); clearAllErrors(); }}>
                ¿Olvidaste tu contraseña?
              </p>
            </form>
          </>
        )}
        {/* ... Resto de pantallas (primer_ingreso, recuperar, reset) se mantienen ... */}
        {pantalla === 'primer_ingreso' && (
             <h2 style={s.titulo}>Configurar cuenta</h2>
             // ... tu código de primer ingreso
        )}
      </div>
    </div>
  );
};

const s = {
  page: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f0f0" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "360px" },
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  inputError: { borderColor: "red" },
  boton: { padding: "12px", backgroundColor: "#502bc0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" },
  botonBloqueado: { backgroundColor: "#999", cursor: "not-allowed" },
  link: { color: "#502bc0", textAlign: "center", cursor: "pointer", fontSize: "13px", textDecoration: "underline" },
  errorCampo: { color: "red", fontSize: "12px", margin: 0, textAlign: 'center' },
};

export default LoginAdmin;