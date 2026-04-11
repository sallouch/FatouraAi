/**
 * Format error response
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: number, limit: number) => {
  const validPage = Math.max(1, isNaN(page) ? 1 : Math.floor(page));
  const validLimit = Math.max(1, Math.min(100, isNaN(limit) ? 10 : Math.floor(limit)));
  return { page: validPage, limit: validLimit };
};

/**
 * Calculate pagination offset
 */
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Format date to ISO string
 */
export const formatDate = (date?: Date): string => {
  return (date || new Date()).toISOString();
};

/**
 * Validate price
 */
export const validatePrice = (price: number): boolean => {
  return Number.isFinite(price) && price >= 0;
};

/**
 * Validate quantity
 */
export const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity >= 0;
};
