export class Usuario {
  constructor({ username, email, rol, permisos = {} }) {
    this.username = username;
    this.email = email || "";
    this.rol = rol || "trabajador";
    this.permisos = permisos;
  }

  tienePermiso(modulo, accion) {
    if (this.rol === "superusuario") return true;
    return this.permisos[modulo]?.[accion] || false;
  }
}
