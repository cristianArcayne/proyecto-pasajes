import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './core/context/AuthContext';
import LoginAdmin from './modules/seguridad/ui/FormularioLogin'; 
import FormularioCompra from './modules/ventas/ui/FormularioVentaUI';
import PanelAdmin from './modules/seguridad/ui/MenuPrincipal';
import ResetPassword from './modules/seguridad/ui/FormularioRecuperacion';

const SeleccionarPerfil = () => {
  const navigate = useNavigate();

  return (
    <div className="perfil-container">
      <h1 className="perfil-titulo">Venta de Pasajes</h1>
      <h2 className="perfil-subtitulo">Elige tu tipo de cuenta</h2>

      <div className="perfil-cards">
        
        {/* PASAJERO */}
        <div 
          className="perfil-card" 
          onClick={() => navigate('/registro-compra')}
        >
          <div style={{ fontSize: '100px' }}>👤</div>
          <p><strong>Pasajero (Compra Virtual)</strong></p>
        </div>

        {/* ADMINISTRADOR */}
        <div 
          className="perfil-card" 
          onClick={() => navigate('/login-admin')}
        >
          <div style={{ fontSize: '100px' }}>💻</div>
          <p><strong>Administrador</strong></p>
        </div>

      </div>
    </div>
  );
};

function App() {
  return (
    /* ✅ IMPORTANTE: AuthProvider debe envolver toda la aplicación */
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SeleccionarPerfil />} />
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/registro-compra" element={<FormularioCompra />} />
          <Route path="/panel-admin" element={<PanelAdmin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;