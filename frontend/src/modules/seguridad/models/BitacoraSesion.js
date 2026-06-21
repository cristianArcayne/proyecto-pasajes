export class BitacoraSesion {
  constructor({ id_bitacora, usuario, accion, fecha_hora, ip_address, detalles }) {
    this.id_bitacora = id_bitacora;
    this.usuario = usuario;
    this.accion = accion;
    this.fecha_hora = fecha_hora;
    this.ip_address = ip_address || "";
    this.detalles = detalles || "";
  }
}
