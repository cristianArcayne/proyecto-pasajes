import { useState, useEffect, useCallback } from "react";
import api from "../../../core/services/api";

const tiposPredefinidos = [
  { id: "1", nombre: "Sobre / Documentos", base: 15 },
  { id: "2", nombre: "Caja Mediana", base: 30 },
  { id: "3", nombre: "Carga Grande / Pesada", base: 60 },
];

export const useEncomiendasController = () => {
  const [viajes, setViajes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({
    ci_remitente: "",
    nombre_remitente: "",
    telefono_remitente: "",
    peso_kg: "",
    descripcion_carga: "",
    id_viaje: "",
    tipo_encomienda_id: "1", // 1: Documento, 2: Caja Mediana, 3: Carga Pesada
  });

  const [precioTotal, setPrecioTotal] = useState(0);


  // Cargar lista de viajes y clientes
  const inicializarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resViajes, resClientes] = await Promise.all([
        api.get("viajes-admin/"),
        api.get("clientes/"),
      ]);
      setViajes(resViajes.data);
      setClientes(resClientes.data);
    } catch (err) {
      console.error("Error al cargar datos iniciales de encomiendas:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    inicializarDatos();
  }, [inicializarDatos]);

  // Recalcular precio total cuando cambia el peso o el tipo
  useEffect(() => {
    const tipo = tiposPredefinidos.find((t) => t.id === form.tipo_encomienda_id);
    const base = tipo ? tipo.base : 15;
    const peso = parseFloat(form.peso_kg) || 0;
    const extraPorPeso = peso * 3; // 3 Bs por Kg adicional
    setPrecioTotal(base + extraPorPeso);
  }, [form.peso_kg, form.tipo_encomienda_id]);

  // Buscar cliente por CI
  const buscarClientePorCI = (ciValue) => {
    const clienteEncontrado = clientes.find(
      (c) => String(c.ci) === String(ciValue)
    );
    if (clienteEncontrado) {
      setForm((prev) => ({
        ...prev,
        nombre_remitente: clienteEncontrado.nombre,
        telefono_remitente: clienteEncontrado.telefono,
      }));
    }
  };

  const guardarEncomienda = async (onSuccess) => {
    if (!form.ci_remitente || !form.nombre_remitente || !form.peso_kg || !form.id_viaje) {
      alert("⚠️ Por favor completa todos los campos requeridos.");
      return;
    }

    setCargando(true);
    try {
      // 1. Asegurar o registrar el cliente si no existe en la BD
      const clienteExiste = clientes.some(
        (c) => String(c.ci) === String(form.ci_remitente)
      );

      if (!clienteExiste) {
        await api.post("clientes/", {
          ci: parseInt(form.ci_remitente),
          nombre: form.nombre_remitente,
          telefono: form.telefono_remitente || "0",
        });
      }

      // 2. Registrar la encomienda
      // NOTA: Generamos un nro_encomienda aleatorio de 6 dígitos
      const randomNro = Math.floor(100000 + Math.random() * 900000);
      
      const payload = {
        nro_encomienda: randomNro,
        peso_kg: parseFloat(form.peso_kg),
        precio_total: precioTotal,
        descripcion_carga: form.descripcion_carga,
        ci_remitente: parseInt(form.ci_remitente),
        id_viaje: parseInt(form.id_viaje),
        // Los campos id_encomienda e id_detalle_venta los enviamos nulos o por defecto si no son obligatorios en base de datos
        id_encomienda: null,
        id_detalle_venta: null,
      };

      await api.post("encomiendas/", payload);
      alert(`✅ Encomienda registrada con éxito!\nNro de Guía: ${randomNro}`);
      
      // Limpiar formulario
      setForm({
        ci_remitente: "",
        nombre_remitente: "",
        telefono_remitente: "",
        peso_kg: "",
        descripcion_carga: "",
        id_viaje: "",
        tipo_encomienda_id: "1",
      });

      // Recargar lista de clientes
      const resClientes = await api.get("clientes/");
      setClientes(resClientes.data);

      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al registrar la encomienda");
    } finally {
      setCargando(false);
    }
  };

  return {
    form,
    setForm,
    viajes,
    cargando,
    precioTotal,
    tiposPredefinidos,
    buscarClientePorCI,
    guardarEncomienda,
  };
};
