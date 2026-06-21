export class Rol {
  constructor(nombre, modulosPermitidos = []) {
    this.nombre = nombre;
    this.modulosPermitidos = modulosPermitidos;
  }

  static getRolesDisponibles() {
    return [
      { id: "superusuario", etiqueta: "Superusuario (Administrador Global)" },
      { id: "trabajador", etiqueta: "Trabajador (Operador de Boletería)" }
    ];
  }
}
