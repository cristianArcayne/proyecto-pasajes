import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; // Asegúrate de haber creado este archivo
import LoginAdmin from './login'; 
import FormularioCompra from './usuario_venta_pasaje';
import PanelAdmin from './PanelAdmin';

const SeleccionarPerfil = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#502bc0', fontSize: '3rem' }}>Venta de Pasajes</h1>
      <h2 style={{ color: '#2980B9' }}>Elige tu tipo de cuenta</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '50px' }}>
        
        {/* PASAJERO */}
        <div 
          className="tarjeta-perfil" 
          style={styles.card} 
          onClick={() => navigate('/registro-compra')}
        >
          <div style={{ fontSize: '100px' }}>👤</div>
          <p><strong>Pasajero (Compra Virtual)</strong></p>
        </div>

        {/* ADMINISTRADOR */}
        <div 
          className="tarjeta-perfil" 
          style={styles.card} 
          onClick={() => navigate('/login-admin')}
        >
          <div style={{ fontSize: '100px' }}>💻</div>
          <p><strong>Administrador</strong></p>
        </div>

      </div>
    </div>
  );
};

// Estilos básicos para las tarjetas
const styles = {
  card: {
    cursor: 'pointer',
    padding: '20px',
    borderRadius: '15px',
    border: '1px solid #ddd',
    transition: 'transform 0.2s',
    backgroundColor: '#f9f9f9',
    width: '200px'
  }
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;