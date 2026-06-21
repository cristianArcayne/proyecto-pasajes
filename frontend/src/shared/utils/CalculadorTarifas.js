/**
 * Calculador de tarifas de pasajes con descuentos aplicados
 */
export const CalculadorTarifas = {
  calcularPrecioFinal: (precioBase, tipoPasajero) => {
    const tipo = String(tipoPasajero).toLowerCase();
    
    // Descuentos típicos
    if (tipo.includes("menor") || tipo.includes("niño") || tipo.includes("estudiante")) {
      return Math.round(precioBase * 0.8); // 20% descuento
    }
    if (tipo.includes("adulto mayor") || tipo.includes("tercera edad") || tipo.includes("anciano")) {
      return Math.round(precioBase * 0.7); // 30% descuento
    }
    
    return precioBase;
  }
};
