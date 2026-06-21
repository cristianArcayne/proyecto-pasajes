export class Encomienda {
  constructor({
    nro_encomienda,
    peso_kg,
    precio_total,
    descripcion_carga,
    ci_remitente,
    id_encomienda,
    id_viaje,
    id_detalle_venta,
  }) {
    this.nro_encomienda = nro_encomienda;
    this.peso_kg = peso_kg || 0.0;
    this.precio_total = precio_total || 0.0;
    this.descripcion_carga = descripcion_carga || "";
    this.ci_remitente = ci_remitente;
    this.id_encomienda = id_encomienda;
    this.id_viaje = id_viaje;
    this.id_detalle_venta = id_detalle_venta;
  }
}
