/**
 * Formatea un número como moneda colombiana (COP)
 * Formato: $130.500, $1.500.000, etc.
 * @param {number|string} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada como moneda colombiana
 */
export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "$ 0";
  
  // Convertir a número si es string
  const numAmount = typeof amount === 'string' 
    ? parseFloat(amount.replace(/[^0-9.-]/g, '')) 
    : parseFloat(amount);
  
  if (isNaN(numAmount)) return "$ 0";
  
  // Formatear manualmente con punto como separador de miles
  const parts = numAmount.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Si hay decimales, agregarlos
  if (decimalPart) {
    return `$ ${formattedInteger},${decimalPart}`;
  }
  
  return `$ ${formattedInteger}`;
};

