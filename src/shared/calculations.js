/**
 * Business calculations module
 * All monetary calculations for the POS system
 */

/**
 * Round a number to specified decimal places
 * @param {number} value - The value to round
 * @param {number} decimalPlaces - Number of decimal places (default: 2)
 * @returns {number} Rounded value
 */
function round(value, decimalPlaces = 2) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate sale price from purchase price and profit margin
 * @param {number} purchasePrice - Cost price of the product
 * @param {number} profitMargin - Profit margin percentage
 * @returns {number} Sale price
 */
function calculateSalePrice(purchasePrice, profitMargin) {
  if (purchasePrice <= 0) {
    throw new Error('Valor de compra deve ser positivo');
  }
  if (profitMargin < 0) {
    throw new Error('Margem de lucro não pode ser negativa');
  }

  const price = purchasePrice * (1 + profitMargin / 100);
  return round(price);
}

/**
 * Calculate subtotal for a single item
 * @param {number} salePrice - Unit sale price
 * @param {number} quantity - Quantity of items
 * @returns {number} Subtotal
 */
function calculateSubtotal(salePrice, quantity) {
  if (salePrice <= 0 || quantity <= 0) {
    return 0;
  }
  return round(salePrice * quantity);
}

/**
 * Calculate total for a sale (sum of all items)
 * @param {Array<{salePrice: number, quantity: number}>} items - Array of cart items
 * @returns {number} Total sale value
 */
function calculateTotal(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    const subtotal = item.salePrice * item.quantity;
    return sum + subtotal;
  }, 0);

  return round(total);
}

/**
 * Calculate change to return to customer
 * @param {number} amountPaid - Amount paid by customer
 * @param {number} total - Total sale value
 * @returns {number} Change amount
 */
function calculateChange(amountPaid, total) {
  if (amountPaid < total) {
    throw new Error('Valor pago insuficiente');
  }

  return round(amountPaid - total);
}

/**
 * Apply percentage discount to items
 * @param {Array<{salePrice: number}>} items - Array of cart items
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {Array} Items with discounted prices
 */
function applyDiscount(items, discountPercent) {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Percentual de desconto inválido');
  }

  return items.map(item => ({
    ...item,
    salePrice: round(item.salePrice * (1 - discountPercent / 100))
  }));
}

/**
 * Calculate profit for a single item
 * @param {number} salePrice - Sale price
 * @param {number} purchasePrice - Purchase price
 * @param {number} quantity - Quantity sold
 * @returns {number} Profit amount
 */
function calculateItemProfit(salePrice, purchasePrice, quantity) {
  const unitProfit = salePrice - purchasePrice;
  return round(unitProfit * quantity);
}

/**
 * Calculate total invested (cost) for sales
 * @param {Array<{purchasePrice: number, quantity: number}>} sales - Array of sales
 * @returns {number} Total cost
 */
function calculateTotalInvested(sales) {
  if (!sales || sales.length === 0) {
    return 0;
  }

  return round(
    sales.reduce((sum, sale) => {
      return sum + (sale.purchasePrice * sale.quantity);
    }, 0)
  );
}

/**
 * Calculate total sales revenue
 * @param {Array<{total: number}>} sales - Array of sales with total field
 * @returns {number} Total revenue
 */
function calculateTotalRevenue(sales) {
  if (!sales || sales.length === 0) {
    return 0;
  }

  return round(
    sales.reduce((sum, sale) => {
      return sum + sale.total;
    }, 0)
  );
}

/**
 * Calculate total profit
 * @param {Array<{purchasePrice: number, salePrice: number, quantity: number}>} sales - Array of sales
 * @returns {number} Total profit
 */
function calculateTotalProfit(sales) {
  const totalInvested = calculateTotalInvested(sales);
  const totalRevenue = calculateTotalRevenue(sales);

  return round(totalRevenue - totalInvested);
}

/**
 * Calculate real profit margin after discounts
 * @param {number} salePrice - Final sale price
 * @param {number} purchasePrice - Purchase price
 * @returns {number} Real profit margin percentage
 */
function calculateRealMargin(salePrice, purchasePrice) {
  if (purchasePrice <= 0) {
    return 0;
  }
  return round(((salePrice - purchasePrice) / purchasePrice) * 100);
}

/**
 * Validate monetary value
 * @param {number} value - Value to validate
 * @returns {boolean} True if valid
 */
function isValidMonetaryValue(value) {
  return typeof value === 'number' &&
    !isNaN(value) &&
    value >= 0 &&
    value < 1000000;
}

/**
 * Validate quantity
 * @param {number} quantity - Quantity to validate
 * @returns {boolean} True if valid
 */
function isValidQuantity(quantity) {
  return Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity < 1000000;
}

/**
 * Validate profit margin
 * @param {number} margin - Margin to validate
 * @returns {boolean} True if valid
 */
function isValidMargin(margin) {
  return Number.isInteger(margin) &&
    margin >= 0 &&
    margin <= 1000;
}

module.exports = {
  round,
  calculateSalePrice,
  calculateSubtotal,
  calculateTotal,
  calculateChange,
  applyDiscount,
  calculateItemProfit,
  calculateTotalInvested,
  calculateTotalRevenue,
  calculateTotalProfit,
  calculateRealMargin,
  isValidMonetaryValue,
  isValidQuantity,
  isValidMargin
};
