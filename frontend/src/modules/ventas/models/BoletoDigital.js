export class BoletoDigital {
  constructor({ id_pasaje, ref_transaccion, qr_base64 }) {
    this.id_pasaje = id_pasaje;
    this.ref_transaccion = ref_transaccion;
    this.qr_base64 = qr_base64 || "";
  }
}
