
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginAdmin from './login'; 
import FormularioCompra from './usuario_venta_pasaje';
import PanelAdmin from './PanelAdmin';

const SeleccionarPerfil = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1 style={{ color: '#502bc0', fontSize: '3rem' }}>Venta de Pasajes</h1>
      <h2 style={{ color: '#2980B9' }}>Elige tu tipo de cuenta</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '50px' }}>
        
        {/* PASAJERO */}
        <div className="tarjeta-perfil" style={{cursor: 'pointer'}} onClick={() => navigate('/registro-compra')}>
          <div style={{ fontSize: '100px' }}>👤</div>
          <p><strong>Pasajero (Compra Virtual)</strong></p>
        </div>

        {/* ADMINISTRADOR */}
        <div className="tarjeta-perfil" style={{cursor: 'pointer'}} onClick={() => navigate('/login-admin')}>
          <div style={{ fontSize: '100px' }}>💻</div>
          <p><strong>Administrador</strong></p>
        </div>

      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SeleccionarPerfil />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/registro-compra" element={<FormularioCompra />} />
         <Route path="/panel-admin" element={<PanelAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;