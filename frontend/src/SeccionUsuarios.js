import React, { useState } from 'react';
import api from './api';

const SeccionUsuarios = () => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [permisos, setPermisos] = useState({
        clientes: { ver: true, crear: false, modificar: false, eliminar: false },
        buses: { ver: true, crear: false, modificar: false, eliminar: false },
        choferes: { ver: true, crear: false, modificar: false, eliminar: false },
        viajes: { ver: true, crear: false, modificar: false, eliminar: false }
    });

    const manejarPermiso = (modulo, accion) => {
        setPermisos(prev => ({
            ...prev,
            [modulo]: { ...prev[modulo], [accion]: !prev[modulo][accion] }
        }));
    };

    const guardarUsuario = async () => {
        try {
            await api.post('usuarios/crear/', { ...form, permisos });
            alert("Usuario creado y registrado en Bitácora");
        } catch (err) { alert("Error al crear usuario"); }
    };

    return (
        <div style={{ maxWidth: '600px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h3>Crear Nuevo Trabajador</h3>
            <input placeholder="Usuario" style={styles.input} onChange={e => setForm({...form, username: e.target.value})} />
            <input type="password" placeholder="Contraseña" style={styles.input} onChange={e => setForm({...form, password: e.target.value})} />
            
            <h4>Permisos del Sistema</h4>
            {Object.keys(permisos).map(modulo => (
                <div key={modulo} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{modulo}: </strong>
                    {['ver', 'crear', 'modificar', 'eliminar'].map(accion => (
                        <label key={accion} style={{ marginLeft: '10px' }}>
                            <input type="checkbox" checked={permisos[modulo][accion]} onChange={() => manejarPermiso(modulo, accion)} />
                            {accion}
                        </label>
                    ))}
                </div>
            ))}
            <button onClick={guardarUsuario} style={styles.btn}>Guardar Trabajador</button>
        </div>
    );
};

const styles = {
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' },
    btn: { width: '100%', padding: '10px', background: '#502bc0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default SeccionUsuarios;