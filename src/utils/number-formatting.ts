/**
 * Utilitaires pour le formatage sécurisé des nombres
 */

/**
 * Version sécurisée de toFixed qui gère les valeurs nulles, undefined et NaN
 */
export const safeToFixed = (value: number | string | null | undefined, decimals: number = 2): string => {
  // Convertir en nombre si c'est une string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Vérifier si la valeur est valide
  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return '0';
  }
  
  // Vérifier si c'est un nombre fini
  if (!isFinite(numValue)) {
    return '0';
  }
  
  try {
    return numValue.toFixed(decimals);
  } catch (error) {
    console.warn('Error in safeToFixed:', error, 'value:', value);
    return '0';
  }
};

/**
 * Formatage sécurisé des pourcentages
 */
export const safePercentage = (value: number | null | undefined, decimals: number = 1): string => {
  const formatted = safeToFixed(value, decimals);
  return `${formatted}%`;
};

/**
 * Formatage sécurisé des pourcentages avec signe
 */
export const safePercentageWithSign = (value: number | null | undefined, decimals: number = 1): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return '0%';
  }
  
  const sign = numValue >= 0 ? '+' : '';
  const formatted = safeToFixed(value, decimals);
  return `${sign}${formatted}%`;
};

/**
 * Calcul sécurisé de pourcentage
 */
export const safeCalculatePercentage = (
  numerator: number | null | undefined, 
  denominator: number | null | undefined,
  decimals: number = 1
): string => {
  if (!numerator || !denominator || denominator === 0) {
    return '0';
  }
  
  const percentage = (numerator / denominator) * 100;
  return safeToFixed(percentage, decimals);
};

/**
 * Somme sécurisée avec reduce
 */
export const safeSum = (array: Array<{ [key: string]: number | null | undefined }>, key: string): number => {
  if (!Array.isArray(array)) {
    return 0;
  }
  
  return array.reduce((sum, item) => {
    const value = item[key];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return sum + (numValue && !isNaN(numValue) ? numValue : 0);
  }, 0);
}; 