export class AsistenteIAModel {
  constructor({ consulta = "", respuesta = "", tipoConsulta = "", fechaHora = "", tabla = null } = {}) {
    this.consulta = consulta;
    this.respuesta = respuesta;
    this.tipoConsulta = tipoConsulta;
    this.fechaHora = fechaHora;
    this.tabla = tabla;
  }
  static desdeRespuesta(data) {
    return new AsistenteIAModel({ consulta: data.consulta, respuesta: data.respuesta,
      tipoConsulta: data.tipo_consulta, fechaHora: data.fecha_hora, tabla: data.tabla });
  }
}
