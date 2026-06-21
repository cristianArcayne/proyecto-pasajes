/**
 * Utilidad de validación de datos generales para el sistema
 */
export const ValidadorDatos = {
  validarCi: (ci) => {
    const num = Number(ci);
    return !isNaN(num) && num > 0;
  },
  
  validarTelefono: (telefono) => {
    const cleaned = String(telefono).trim();
    return cleaned.length >= 7 && cleaned.length <= 15;
  },

  validarEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  validarTarjeta: (numero) => {
    const cleaned = String(numero).replace(/\s+/g, "");
    return cleaned.length >= 15 && cleaned.length <= 16;
  }
};
