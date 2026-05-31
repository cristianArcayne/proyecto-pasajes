import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from './api';

// Componentes auxiliares de validación
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
  const { login } = useAuth();
  
  const [pantalla, setPantalla] = useState('login'); // 'login', 'primer_ingreso', 'recuperar'
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [datosLoginTemp, setDatosLoginTemp] = useState(null); // Almacena datos tras primer login temporal

  // Pantalla Primer Ingreso (Cambio de clave obligatoria)
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [correo, setCorreo] = useState('');

  // Pantalla Recuperación de clave
  const [correoRecuperar, setCorreoRecuperar] = useState('');

  // Estados comunes
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // Bloqueo local por intentos fallidos
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
  const clearAllErrors = () => { setErrores({}); setMensaje(''); };

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
      // ✅ IMPORTANTE: Usamos la instancia local api en lugar de axios directo con URL quemada
      const res = await api.post("login/", {
        username: usuario,
        password: password,
      });

      setIntentos(0);

      if (res.data.es_password_temporal) {
        // Guardamos las credenciales y el token temporal
        localStorage.setItem("admin_access", res.data.access);
        setDatosLoginTemp({
          access: res.data.access,
          refresh: res.data.refresh,
          username: res.data.username,
          rol: res.data.rol,
          permisos: res.data.permisos,
          password_actual: password, // Necesario para cambiar_credenciales
        });
        setPantalla('primer_ingreso');
      } else {
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
      setError('global', err.response?.data?.mensaje || "Credenciales incorrectas o cuenta bloqueada.");
    } finally {
      setCargando(false);
    }
  };

  const manejarPrimerIngreso = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (!req.largo || !req.letra || !req.numero) {
      setError('nuevaPassword', 'La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('confirmarPassword', 'Las contraseñas no coinciden.');
      return;
    }

    if (!correo.trim() || !/\S+@\S+\.\S+/.test(correo)) {
      setError('correo', 'Ingresa un correo electrónico de recuperación válido.');
      return;
    }

    setCargando(true);
    try {
      // Registrar nueva clave y correo
      await api.post("cambiar-credenciales/", {
        old_password: datosLoginTemp.password_actual,
        new_password: nuevaPassword,
        correo: correo,
      });

      // Completar login exitoso
      login({
        access: datosLoginTemp.access,
        refresh: datosLoginTemp.refresh,
        username: datosLoginTemp.username,
        rol: datosLoginTemp.rol,
        permisos: datosLoginTemp.permisos,
      });
      navigate('/panel-admin');
    } catch (err) {
      setError('global', err.response?.data?.mensaje || "Error al configurar la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  const manejarRecuperar = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (!correoRecuperar.trim() || !/\S+@\S+\.\S+/.test(correoRecuperar)) {
      setError('correoRecuperar', 'Ingresa un correo electrónico válido.');
      return;
    }

    setCargando(true);
    try {
      await api.post("recuperar-password/", {
        correo: correoRecuperar,
      });
      setMensaje('✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.');
      setCorreoRecuperar('');
    } catch (err) {
      setError('correoRecuperar', err.response?.data?.mensaje || 'No existe una cuenta registrada con este correo.');
    } finally {
      setCargando(false);
    }
  };

  const bloqueado = bloqueadoHasta && Date.now() < bloqueadoHasta;

  return (
    <div style={s.page}>
      <div style={s.card}>
        
        {/* PANTALLA: LOGIN */}
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

        {/* PANTALLA: PRIMER INGRESO (CONFIGURAR CUENTA OBLIGATORIA) */}
        {pantalla === 'primer_ingreso' && (
          <>
            <h2 style={s.titulo}>⚙️ Configurar Cuenta</h2>
            <p style={s.subtitulo}>Debes configurar tu nueva contraseña de seguridad y un correo electrónico de recuperación para continuar.</p>
            
            <form onSubmit={manejarPrimerIngreso} style={s.form}>
              <CampoConError id="nuevaPassword" errores={errores}>
                <input
                  style={s.input}
                  type="password"
                  placeholder="Nueva Contraseña"
                  value={nuevaPassword}
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
                  style={s.input}
                  type="password"
                  placeholder="Confirmar Contraseña"
                  value={confirmarPassword}
                  onChange={(e) => { setConfirmarPassword(e.target.value); clearError('confirmarPassword'); }}
                />
              </CampoConError>

              <CampoConError id="correo" errores={errores}>
                <input
                  style={s.input}
                  type="email"
                  placeholder="Correo de Recuperación"
                  value={correo}
                  onChange={(e) => { setCorreo(e.target.value); clearError('correo'); }}
                />
              </CampoConError>

              {errores.global && <p style={s.errorCampo}>{errores.global}</p>}

              <button style={s.boton} type="submit" disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar y Continuar"}
              </button>
            </form>
          </>
        )}

        {/* PANTALLA: RECUPERAR CONTRASEÑA */}
        {pantalla === 'recuperar' && (
          <>
            <h2 style={s.titulo}>🔑 Recuperar Clave</h2>
            <p style={s.subtitulo}>Ingresa tu correo de recuperación. Te enviaremos un enlace seguro para restablecer tu contraseña.</p>

            {mensaje && <p style={s.success}>{mensaje}</p>}

            <form onSubmit={manejarRecuperar} style={s.form}>
              {!mensaje && (
                <CampoConError id="correoRecuperar" errores={errores}>
                  <input
                    style={s.input}
                    type="email"
                    placeholder="Correo Electrónico"
                    value={correoRecuperar}
                    onChange={(e) => { setCorreoRecuperar(e.target.value); clearError('correoRecuperar'); }}
                    required
                  />
                </CampoConError>
              )}

              <button style={s.boton} type="submit" disabled={cargando || mensaje}>
                {cargando ? "Enviando..." : mensaje ? "Enviado con éxito" : "Enviar Enlace"}
              </button>

              <p style={s.link} onClick={() => { setPantalla('login'); clearAllErrors(); }}>
                Volver al inicio de sesión
              </p>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

const s = {
  page: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f2f5" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "360px" },
  titulo: { color: "#502bc0", textAlign: "center", marginBottom: "8px", fontWeight: "bold" },
  subtitulo: { color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "20px", lineHeight: "1.4" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "11px 13px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", width: "100%", boxSizing: "border-box" },
  inputError: { borderColor: "red" },
  boton: { padding: "12px", backgroundColor: "#502bc0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold", width: "100%" },
  botonBloqueado: { backgroundColor: "#999", cursor: "not-allowed" },
  link: { color: "#502bc0", textAlign: "center", cursor: "pointer", fontSize: "13px", textDecoration: "none", marginTop: "8px", fontWeight: "600" },
  errorCampo: { color: "red", fontSize: "12px", margin: 0, textAlign: 'center' },
  requisitos: { display: "flex", flexDirection: "column", gap: "6px", padding: "6px 8px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #eee" },
  success: { color: "#16a34a", fontSize: "13px", textAlign: 'center', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px', margin: '0 0 16px 0' },
};

export default LoginAdmin;