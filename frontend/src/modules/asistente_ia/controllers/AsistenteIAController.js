import api from "../../../core/services/api";
import { AsistenteIAModel } from "../models/AsistenteIAModel";

export const consultarAsistenteIA = async (consulta) => {
  const response = await api.post("asistente-ia/consultar/", { consulta });
  return AsistenteIAModel.desdeRespuesta(response.data);
};
