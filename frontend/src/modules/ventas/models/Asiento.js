export class Asiento {
  constructor({ nro_asiento, ocupado }) {
    this.nro_asiento = nro_asiento;
    this.ocupado = ocupado || false;
  }
}
