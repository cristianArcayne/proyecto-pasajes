export class DatosConsolidados {
  constructor({
    totalPasajesVendidos = 0,
    ingresosPasajes = 0,
    totalEncomiendasEnviadas = 0,
    ingresosEncomiendas = 0,
    rutaMasFrecuentada = "N/A",
    busMasUtilizado = "N/A",
    totalBuses = 0,
    busesActivos = 0,
    pasajeroFrecuente = "N/A",
    clientesList = [],
    choferesList = [],
    viajesList = [],
    busesList = []
  }) {
    this.totalPasajesVendidos = totalPasajesVendidos;
    this.ingresosPasajes = ingresosPasajes;
    this.totalEncomiendasEnviadas = totalEncomiendasEnviadas;
    this.ingresosEncomiendas = ingresosEncomiendas;
    this.rutaMasFrecuentada = rutaMasFrecuentada;
    this.busMasUtilizado = busMasUtilizado;
    this.totalBuses = totalBuses;
    this.busesActivos = busesActivos;
    this.pasajeroFrecuente = pasajeroFrecuente;
    this.clientesList = clientesList;
    this.choferesList = choferesList;
    this.viajesList = viajesList;
    this.busesList = busesList;
  }

  get ingresosTotales() {
    return this.ingresosPasajes + this.ingresosEncomiendas;
  }
}
