import React, { useState, useEffect, useCallback } from 'react';
import api from './api';

const ModuloGenerico = ({ modulo, accion }) => {
    const [lista, setLista] = useState([]);
    const [form, setForm] = useState({});
    const [busqueda, setBusqueda] = useState('');

    // Configuración de campos según tus modelos de Django
    const config = {
        clientes: { endpoint: 'clientes', id: 'ci', campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Teléfono' } },
        buses: { endpoint: 'flotas', id: 'placa', campos: { placa: 'Placa', modelo: 'Modelo', capacidad_asientos: 'Asientos' } },
        choferes: { endpoint: 'choferes', id: 'ci', campos: { ci: 'C.I.', nombre: 'Nombre', telefono: 'Celular', licencia: 'Licencia' } },
        viajes: { endpoint: 'viajes-admin', id: 'id_viaje', campos: { fecha: 'Fecha', hora: 'Hora', id_ruta: 'ID Ruta', placa: 'Placa Bus' } }
    };

    const conf = config[modulo];

    const cargarDatos = useCallback(async () => {
        try {
            const res = await api.get(`${conf.endpoint}/`);
            setLista(res.data);
        } catch (err) { console.error("Error al cargar", err); }
    }, [conf.endpoint]);

    useEffect(() => {
        if (accion === 'ver_todos' || accion === 'buscar') cargarDatos();
    }, [modulo, accion, cargarDatos]);

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            await api.post(`${conf.endpoint}/`, form);
            alert("Registro guardado con éxito");
            setForm({});
            if (accion === 'ver_todos') cargarDatos();
        } catch (err) { alert("Error al guardar: verifique los datos"); }
    };

    const eliminar = async (id) => {
        if (window.confirm("¿Eliminar este registro?")) {
            await api.delete(`${conf.endpoint}/${id}/`);
            cargarDatos();
        }
    };

    return (
        <div style={{ padding: '10px' }}>
            {/* BUSCADOR */}
            {accion === 'buscar' && (
                <input 
                    placeholder="Escribe para buscar..." 
                    style={styles.inputBusqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                />
            )}

            {/* TABLA: VER TODOS / BUSCAR */}
            {(accion === 'ver_todos' || accion === 'buscar') && (
                <table style={styles.tabla}>
                    <thead>
                        <tr style={{background: '#f8f9fa'}}>
                            {Object.values(conf.campos).map(val => <th key={val} style={styles.th}>{val}</th>)}
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.filter(item => JSON.stringify(item).toLowerCase().includes(busqueda.toLowerCase())).map((item, index) => (
                            <tr key={index}>
                                {Object.keys(conf.campos).map(key => <td key={key} style={styles.td}>{item[key]}</td>)}
                                <td style={styles.td}>
                                    <button onClick={() => eliminar(item[conf.id])} style={styles.btnEliminar}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* FORMULARIO: AÑADIR / CREAR */}
            {(accion === 'crear' || accion === 'modificar') && (
                <form onSubmit={handleGuardar} style={styles.formulario}>
                    <h3 style={{color: '#502bc0'}}>Añadir Nuevo {modulo.slice(0,-1)}</h3>
                    {Object.keys(conf.campos).map(key => (
                        <div key={key} style={{marginBottom: '10px'}}>
                            <label style={{display:'block', fontSize:'13px'}}>{conf.campos[key]}</label>
                            <input 
                                style={styles.inputForm} 
                                required
                                onChange={e => setForm({...form, [key]: e.target.value})} 
                            />
                        </div>
                    ))}
                    <button type="submit" style={styles.btnPrincipal}>Guardar en Base de Datos</button>
                </form>
            )}
        </div>
    );
};

const styles = {
    tabla: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    th: { borderBottom: '2px solid #502bc0', padding: '10px', textAlign: 'left', fontSize: '14px' },
    td: { borderBottom: '1px solid #eee', padding: '10px', fontSize: '14px' },
    inputBusqueda: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '10px' },
    formulario: { maxWidth: '400px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' },
    inputForm: { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' },
    btnPrincipal: { background: '#502bc0', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    btnEliminar: { background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default ModuloGenerico;