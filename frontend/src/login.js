import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ FUERA del componente — nunca se recrean
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

// ─────────────────────────────────────────────
const LoginAdmin = () => {
  const navigate = useNavigate();
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

  // ── Bloqueo por intentos fallidos ──
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
      setError('global', `Demasiados intentos. Espera ${tiempoRestante}s para volver a intentar.`);
      return;
    }

    let valido = true;
    if (!usuario.trim()) { setError('usuario', 'El usuario es obligatorio'); valido = false; }
    if (!password) { setError('password', 'La contraseña es obligatoria'); valido = false; }
    if (!valido) return;

    setCargando(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login-admin/", {
        username: usuario,
        password: password,
      });

      // Login exitoso — resetear intentos
      setIntentos(0);
      setBloqueadoHasta(null);
      localStorage.setItem("admin_access", res.data.access);
      localStorage.setItem("admin_refresh", res.data.refresh);
      localStorage.setItem("admin_nombre", res.data.username);

      if (res.data.es_password_temporal) {
        setTokenTemporal(res.data.access);
        setPantalla('primer_ingreso');
      } else {
        navigate('/panel-admin');
      }
    } catch (err) {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);

      // Calcular bloqueo: 15s, 30s, 60s, 120s...
      if (nuevosIntentos >= 3) {
        const segundos = 15 * Math.pow(2, nuevosIntentos - 3);
        const hasta = Date.now() + segundos * 1000;
        setBloqueadoHasta(hasta);
        setTiempoRestante(segundos);
        setError('global', `Demasiados intentos. Bloqueado por ${segundos}s.`);
      } else {
        const msg = err.response?.data?.mensaje || "Usuario o contraseña incorrectos";
        setError('global', `${msg} (intento ${nuevosIntentos}/3)`);
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarPrimerIngreso = async (e) => {
    e.preventDefault();
    clearAllErrors();
    let valido = true;

    if (!nuevoUsuario.trim()) { setError('nuevoUsuario', 'El nombre de usuario es obligatorio'); valido = false; }
    if (!correo.trim()) { setError('correo', 'El correo es obligatorio'); valido = false; }
    if (nuevaPassword.length < 8) { setError('nuevaPassword', 'Debe tener al menos 8 caracteres'); valido = false; }
    else if (!req.letra) { setError('nuevaPassword', 'Debe contener al menos una letra'); valido = false; }
    else if (!req.numero) { setError('nuevaPassword', 'Debe contener al menos un número'); valido = false; }
    if (nuevaPassword !== confirmarPassword) { setError('confirmarPassword', 'Las contraseñas no coinciden'); valido = false; }
    if (!valido) return;

    setCargando(true);
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/cambiar-credenciales/",
        { nuevo_username: nuevoUsuario, nueva_password: nuevaPassword, correo },
        { headers: { Authorization: `Bearer ${tokenTemporal}` } }
      );
      setMensaje("✅ Credenciales guardadas. Ahora inicia sesión con tu nuevo usuario.");
      setTimeout(() => {
        setPantalla('login');
        setUsuario(''); setPassword(''); setMensaje('');
      }, 2500);
    } catch (err) {
      setError('global', err.response?.data?.mensaje || "Error al guardar credenciales");
    } finally {
      setCargando(false);
    }
  };

  const manejarRecuperar = async (e) => {
    e.preventDefault();
    clearAllErrors();
    if (!correoRecuperar.trim()) { setError('correoRecuperar', 'Ingresa tu correo electrónico'); return; }

    setCargando(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/solicitar-recuperacion/", { correo: correoRecuperar });
      setMensaje("📧 Correo enviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      setError('global', err.response?.data?.mensaje || "Error al enviar correo");
    } finally {
      setCargando(false);
    }
  };

  const manejarReset = async (e) => {
    e.preventDefault();
    clearAllErrors();
    if (!tokenReset.trim()) { setError('tokenReset', 'Ingresa el token del correo'); return; }
    if (!passwordReset) { setError('passwordReset', 'Ingresa la nueva contraseña'); return; }

    setCargando(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/reset-password/", {
        token: tokenReset, nueva_password: passwordReset,
      });
      setMensaje("✅ Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => { setPantalla('login'); setMensaje(''); }, 2500);
    } catch (err) {
      setError('global', err.response?.data?.mensaje || "Token inválido o expirado");
    } finally {
      setCargando(false);
    }
  };

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
              {mensaje && <p style={s.exito}>{mensaje}</p>}
              <button style={{ ...s.boton, ...(bloqueado ? s.botonBloqueado : {}) }} type="submit" disabled={cargando || bloqueado}>
                {bloqueado ? `Espera ${tiempoRestante}s` : cargando ? "Verificando..." : "Ingresar"}
              </button>
              <p style={s.link} onClick={() => { setPantalla('recuperar'); clearAllErrors(); setMensaje(''); }}>
                ¿Olvidaste tu contraseña?
              </p>
            </form>
          </>
        )}

        {pantalla === 'primer_ingreso' && (
          <>
            <h2 style={s.titulo}>👤 Crea tus credenciales</h2>
            <p style={s.subtitulo}>Es tu primer ingreso. Crea tu propio usuario, contraseña y correo de recuperación.</p>
            <form onSubmit={manejarPrimerIngreso} style={s.form}>
              <CampoConError id="nuevoUsuario" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.nuevoUsuario ? s.inputError : {}) }}
                  type="text" placeholder="Nuevo nombre de usuario" value={nuevoUsuario}
                  onChange={(e) => { setNuevoUsuario(e.target.value); clearError('nuevoUsuario'); }}
                />
              </CampoConError>
              <CampoConError id="correo" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.correo ? s.inputError : {}) }}
                  type="email" placeholder="Correo electrónico" value={correo}
                  onChange={(e) => { setCorreo(e.target.value); clearError('correo'); }}
                />
              </CampoConError>
              <CampoConError id="nuevaPassword" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.nuevaPassword ? s.inputError : {}) }}
                  type="password" placeholder="Nueva contraseña" value={nuevaPassword}
                  onChange={(e) => { setNuevaPassword(e.target.value); clearError('nuevaPassword'); }}
                />
              </CampoConError>
              <div style={s.requisitos}>
                <ReqItem ok={req.largo} texto="Mínimo 8 caracteres" />
                <ReqItem ok={req.letra} texto="Al menos una letra" />
                <ReqItem ok={req.numero} texto="Al menos un número" />
              </div>
              <CampoConError id="confirmarPassword" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.confirmarPassword ? s.inputError : {}) }}
                  type="password" placeholder="Confirmar contraseña" value={confirmarPassword}
                  onChange={(e) => { setConfirmarPassword(e.target.value); clearError('confirmarPassword'); }}
                />
              </CampoConError>
              {errores.global && <p style={s.errorCampo}>{errores.global}</p>}
              {mensaje && <p style={s.exito}>{mensaje}</p>}
              <button style={s.boton} type="submit" disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar y continuar"}
              </button>
            </form>
          </>
        )}

        {pantalla === 'recuperar' && (
          <>
            <h2 style={s.titulo}>📧 Recuperar contraseña</h2>
            <p style={s.subtitulo}>Ingresa el correo que registraste y te enviaremos un enlace.</p>
            <form onSubmit={manejarRecuperar} style={s.form}>
              <CampoConError id="correoRecuperar" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.correoRecuperar ? s.inputError : {}) }}
                  type="email" placeholder="Tu correo electrónico" value={correoRecuperar}
                  onChange={(e) => { setCorreoRecuperar(e.target.value); clearError('correoRecuperar'); }}
                />
              </CampoConError>
              {errores.global && <p style={s.errorCampo}>{errores.global}</p>}
              {mensaje && <p style={s.exito}>{mensaje}</p>}
              <button style={s.boton} type="submit" disabled={cargando}>
                {cargando ? "Enviando..." : "Enviar enlace"}
              </button>
              <p style={s.link} onClick={() => { setPantalla('login'); clearAllErrors(); setMensaje(''); }}>
                ← Volver al login
              </p>
            </form>
          </>
        )}

        {pantalla === 'reset' && (
          <>
            <h2 style={s.titulo}>🔑 Nueva contraseña</h2>
            <form onSubmit={manejarReset} style={s.form}>
              <CampoConError id="tokenReset" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.tokenReset ? s.inputError : {}) }}
                  type="text" placeholder="Token del correo" value={tokenReset}
                  onChange={(e) => { setTokenReset(e.target.value); clearError('tokenReset'); }}
                />
              </CampoConError>
              <CampoConError id="passwordReset" errores={errores}>
                <input
                  style={{ ...s.input, ...(errores.passwordReset ? s.inputError : {}) }}
                  type="password" placeholder="Nueva contraseña" value={passwordReset}
                  onChange={(e) => { setPasswordReset(e.target.value); clearError('passwordReset'); }}
                />
              </CampoConError>
              {errores.global && <p style={s.errorCampo}>{errores.global}</p>}
              {mensaje && <p style={s.exito}>{mensaje}</p>}
              <button style={s.boton} type="submit" disabled={cargando}>
                {cargando ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

const s = {
  page: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f0f0" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "360px" },
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px" },
  subtitulo: { color: "#666", fontSize: "14px", textAlign: "center", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  inputError: { borderColor: "red" },
  boton: { padding: "12px", backgroundColor: "#502bc0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" },
  botonBloqueado: { backgroundColor: "#999", cursor: "not-allowed" },
  link: { color: "#502bc0", textAlign: "center", cursor: "pointer", fontSize: "13px", textDecoration: "underline" },
  errorCampo: { color: "red", fontSize: "12px", margin: 0 },
  exito: { color: "green", fontSize: "13px", textAlign: "center", margin: 0 },
  requisitos: { background: "#f9f5ff", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "6px" },
};

export default LoginAdmin;