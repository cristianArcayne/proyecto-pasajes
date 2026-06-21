export class Reporte {
  constructor({ id, tipo, fechaInicio, fechaFin, formato = "PDF", creadoPor }) {
    this.id = id || Math.floor(1000 + Math.random() * 9000);
    this.tipo = tipo; // "ventas", "logistica", "encomiendas"
    this.fechaInicio = fechaInicio || "";
    this.fechaFin = fechaFin || "";
    this.formato = formato;
    this.creadoPor = creadoPor || "admin";
    this.fechaCreacion = new Date().toISOString().split("T")[0];
  }
}
