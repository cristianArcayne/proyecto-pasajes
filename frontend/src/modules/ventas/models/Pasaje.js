export class Pasaje {
  constructor({ id_pasaje, precio_final, estado_pasaje, nombre_pasajero, ci_pasajero, telefono_pasajero, id_tipo, id_viaje, nro_asiento, placa_bus }) {
    this.id_pasaje = id_pasaje;
    this.precio_final = precio_final;
    this.estado_pasaje = estado_pasaje || "VENDIDO";
    this.nombre_pasajero = nombre_pasajero;
    this.ci_pasajero = ci_pasajero;
    this.telefono_pasajero = telefono_pasajero;
    this.id_tipo = id_tipo;
    this.id_viaje = id_viaje;
    this.nro_asiento = nro_asiento;
    this.placa_bus = placa_bus;
  }
}
