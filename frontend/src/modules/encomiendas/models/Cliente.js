export class Cliente {
  constructor({ ci, nombre, telefono, comentario = "" }) {
    this.ci = ci;
    this.nombre = nombre || "";
    this.telefono = telefono || "";
    this.comentario = comentario;
  }
}
