export class Viaje {
  constructor({ id_viaje, fecha, hora, origen, destino, precio, placa }) {
    this.id_viaje = id_viaje;
    this.fecha = fecha;
    this.hora = hora;
    this.origen = origen;
    this.destino = destino;
    this.precio = precio;
    this.placa = placa;
  }
}
