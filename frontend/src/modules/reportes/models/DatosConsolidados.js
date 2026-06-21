export class DatosConsolidados {
  constructor({
    totalPasajesVendidos = 0,
    ingresosPasajes = 0,
    totalEncomiendasEnviadas = 0,
    ingresosEncomiendas = 0,
    rutaMasFrecuentada = "N/A",
    busMasUtilizado = "N/A",
  }) {
    this.totalPasajesVendidos = totalPasajesVendidos;
    this.ingresosPasajes = ingresosPasajes;
    this.totalEncomiendasEnviadas = totalEncomiendasEnviadas;
    this.ingresosEncomiendas = ingresosEncomiendas;
    this.rutaMasFrecuentada = rutaMasFrecuentada;
    this.busMasUtilizado = busMasUtilizado;
  }

  get ingresosTotales() {
    return this.ingresosPasajes + this.ingresosEncomiendas;
  }
}
