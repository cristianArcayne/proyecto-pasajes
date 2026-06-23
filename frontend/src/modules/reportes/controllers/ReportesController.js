import { useState, useCallback } from "react";
import api from "../../../core/services/api";
import { DatosConsolidados } from "../models/DatosConsolidados";

export const useReportesController = () => {
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
  });
  
  const [datos, setDatos] = useState(new DatosConsolidados({}));
  const [pasajesList, setPasajesList] = useState([]);

  const generarReporte = useCallback(async () => {
    setCargando(true);
    try {
      // 1. Fetch relevant databases for aggregation with individual error catching to prevent 403 breakdowns
      const [resPasajes, resEncomiendas, resViajes, resBuses, resChoferes, resClientes] = await Promise.all([
        api.get("pasajes/").catch(err => {
          console.warn("Sin permisos o error al cargar pasajes:", err);
          return { data: [] };
        }),
        api.get("encomiendas/").catch(err => {
          console.warn("Sin permisos o error al cargar encomiendas:", err);
          return { data: [] };
        }),
        api.get("viajes-admin/").catch(err => {
          console.warn("Sin permisos o error al cargar viajes:", err);
          return { data: [] };
        }),
        api.get("flotas/").catch(err => {
          console.warn("Sin permisos o error al cargar flotas:", err);
          return { data: [] };
        }),
        api.get("choferes/").catch(err => {
          console.warn("Sin permisos o error al cargar choferes:", err);
          return { data: [] };
        }),
        api.get("clientes/").catch(err => {
          console.warn("Sin permisos o error al cargar clientes:", err);
          return { data: [] };
        }),
      ]);

      const pasajes = resPasajes.data || [];
      const encomiendas = resEncomiendas.data || [];
      const viajes = resViajes.data || [];
      const buses = resBuses.data || [];
      const choferes = resChoferes.data || [];
      const clientes = resClientes.data || [];

      setPasajesList(pasajes);

      // 2. Filter by date if specified
      let pasajesFiltrados = pasajes;
      let encomiendasFiltradas = encomiendas;

      if (filtros.fechaInicio) {
        const inicio = new Date(filtros.fechaInicio);
        pasajesFiltrados = pasajesFiltrados.filter(p => p.fecha_viaje ? new Date(p.fecha_viaje) >= inicio : true);
        encomiendasFiltradas = encomiendasFiltradas.filter(e => {
          const v = viajes.find(x => x.id_viaje === e.id_viaje);
          return v ? new Date(v.fecha) >= inicio : true;
        });
      }

      if (filtros.fechaFin) {
        const fin = new Date(filtros.fechaFin);
        pasajesFiltrados = pasajesFiltrados.filter(p => p.fecha_viaje ? new Date(p.fecha_viaje) <= fin : true);
        encomiendasFiltradas = encomiendasFiltradas.filter(e => {
          const v = viajes.find(x => x.id_viaje === e.id_viaje);
          return v ? new Date(v.fecha) <= fin : true;
        });
      }

      // 3. Compute Metrics
      const totalPasajes = pasajesFiltrados.length;
      const ingresosPasajes = pasajesFiltrados.reduce((sum, p) => sum + (parseFloat(p.precio) || 0), 0);

      const totalEncomiendas = encomiendasFiltradas.length;
      const ingresosEncomiendas = encomiendasFiltradas.reduce((sum, e) => sum + (parseFloat(e.precio_total) || 0), 0);

      // Route popularity based on voyages
      const rutaFrecuencias = {};
      pasajesFiltrados.forEach(p => {
        const rutaKey = p.destino ? `${p.origen} - ${p.destino}` : null;
        if (rutaKey) {
          rutaFrecuencias[rutaKey] = (rutaFrecuencias[rutaKey] || 0) + 1;
        }
      });
      let rutaMasPopular = "N/A";
      let maxRuta = 0;
      Object.entries(rutaFrecuencias).forEach(([ruta, count]) => {
        if (count > maxRuta) {
          maxRuta = count;
          rutaMasPopular = ruta;
        }
      });

      // Bus popularity
      const busFrecuencias = {};
      pasajesFiltrados.forEach(p => {
        if (p.placa_bus) {
          busFrecuencias[p.placa_bus] = (busFrecuencias[p.placa_bus] || 0) + 1;
        }
      });
      let busMasFrecuente = "N/A";
      let maxBus = 0;
      Object.entries(busFrecuencias).forEach(([bus, count]) => {
        if (count > maxBus) {
          maxBus = count;
          busMasFrecuente = bus;
        }
      });

      // Fleet Statistics
      const totalBuses = buses.length;
      const busesActivos = buses.filter(b => b.id_estado === 1 || String(b.id_estado) === "1").length;

      // Frequent Passengers
      const pasajeroFrecuencias = {};
      pasajesFiltrados.forEach(p => {
        if (p.ci_pasajero) {
          const key = `${p.nombre_pasajero} (CI: ${p.ci_pasajero})`;
          pasajeroFrecuencias[key] = (pasajeroFrecuencias[key] || 0) + 1;
        }
      });
      let pasajeroMasFrecuente = "N/A";
      let maxPasajes = 0;
      Object.entries(pasajeroFrecuencias).forEach(([pasajero, count]) => {
        if (count > maxPasajes) {
          maxPasajes = count;
          pasajeroMasFrecuente = `${pasajero} (${count} boletos)`;
        }
      });

      // 4. Update state with domain class instance
      setDatos(new DatosConsolidados({
        totalPasajesVendidos: totalPasajes,
        ingresosPasajes: ingresosPasajes,
        totalEncomiendasEnviadas: totalEncomiendas,
        ingresosEncomiendas: ingresosEncomiendas,
        rutaMasFrecuentada: rutaMasPopular,
        busMasUtilizado: busMasFrecuente,
        totalBuses: totalBuses,
        busesActivos: busesActivos,
        pasajeroFrecuente: pasajeroMasFrecuente,
        clientesList: clientes,
        choferesList: choferes,
        viajesList: viajes,
        busesList: buses
      }));

    } catch (err) {
      console.error("Error al consolidar estadísticas:", err);
      alert("No se pudieron consolidar las estadísticas.");
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  return {
    cargando,
    filtros,
    setFiltros,
    datos,
    generarReporte,
    pasajesList,
  };
};
