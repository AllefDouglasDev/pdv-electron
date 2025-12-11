/**
 * Receipt formatting service
 * Generates text-based receipts for thermal printers
 */

// Default configuration
const DEFAULT_CONFIG = {
  storeName: 'MERCADO REAL',
  subtitle: 'Fluxo de Caixa',
  paperWidth: 80, // 80mm or 58mm
  showOperator: true,
  footerMessage: 'Obrigado pela preferencia!'
};

// Character width based on paper size
const PAPER_CHARS = {
  80: 42,
  58: 32
};

/**
 * Truncate text to fit within max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 2) + '..';
}

/**
 * Align text to the right
 * @param {string} text - Text to align
 * @param {number} width - Total width
 * @returns {string} Right-aligned text
 */
function alignRight(text, width) {
  if (text.length >= width) return text;
  return text.padStart(width);
}

/**
 * Align text to the left
 * @param {string} text - Text to align
 * @param {number} width - Total width
 * @returns {string} Left-aligned text
 */
function alignLeft(text, width) {
  if (text.length >= width) return text;
  return text.padEnd(width);
}

/**
 * Center text
 * @param {string} text - Text to center
 * @param {number} width - Total width
 * @returns {string} Centered text
 */
function center(text, width) {
  if (text.length >= width) return text;
  const spaces = width - text.length;
  const left = Math.floor(spaces / 2);
  return ' '.repeat(left) + text;
}

/**
 * Format currency value (Brazilian format)
 * @param {number} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Format currency with R$ symbol
 * @param {number} value - Value to format
 * @returns {string} Formatted currency
 */
function formatCurrency(value) {
  return 'R$ ' + formatValue(value);
}

/**
 * Remove accents from text (for thermal printers that don't support them)
 * @param {string} text - Text with accents
 * @returns {string} Text without accents
 */
function removeAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format date/time for receipt
 * @param {Date} date - Date object
 * @returns {string} Formatted date/time
 */
function formatDateTime(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate receipt content
 * @param {Object} saleData - Sale data
 * @param {Array} saleData.items - Items in the sale
 * @param {number} saleData.total - Total value
 * @param {number} saleData.amountPaid - Amount paid (optional)
 * @param {number} saleData.change - Change given (optional)
 * @param {number} saleData.discount - Discount percentage (optional)
 * @param {string} saleData.operatorName - Name of the operator
 * @param {Object} config - Configuration options (optional)
 * @returns {string} Formatted receipt text
 */
function generateReceipt(saleData, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const width = PAPER_CHARS[cfg.paperWidth] || 42;
  const lines = [];

  const separator = '='.repeat(width);
  const thinSeparator = '-'.repeat(width);

  // Header
  lines.push(separator);
  lines.push(center(removeAccents(cfg.storeName), width));
  if (cfg.subtitle) {
    lines.push(center(removeAccents(cfg.subtitle), width));
  }
  lines.push(separator);
  lines.push('CUPOM NAO FISCAL');
  lines.push('');

  // Table header - adjust columns based on width
  let colName, colQty, colPrice, colSubtotal;

  if (width >= 42) {
    // 80mm paper
    colName = 14;
    colQty = 4;
    colPrice = 9;
    colSubtotal = width - colName - colQty - colPrice - 3;
  } else {
    // 58mm paper
    colName = 10;
    colQty = 3;
    colPrice = 8;
    colSubtotal = width - colName - colQty - colPrice - 3;
  }

  lines.push(
    alignLeft('Nome', colName) + ' ' +
    alignRight('Qtd', colQty) + ' ' +
    alignRight('Valor', colPrice) + ' ' +
    alignRight('Subtot', colSubtotal)
  );
  lines.push(thinSeparator);

  // Items
  for (const item of saleData.items) {
    const name = truncate(removeAccents(item.name), colName);
    const qty = item.quantity.toString();
    const price = formatValue(item.salePrice || item.unitPrice);
    const subtotal = formatValue(item.subtotal);

    lines.push(
      alignLeft(name, colName) + ' ' +
      alignRight(qty, colQty) + ' ' +
      alignRight(price, colPrice) + ' ' +
      alignRight(subtotal, colSubtotal)
    );
  }

  // Discount info (if any)
  if (saleData.discount && saleData.discount > 0) {
    lines.push(thinSeparator);
    lines.push(alignRight(`Desconto: ${saleData.discount}%`, width));
  }

  // Total
  lines.push(thinSeparator);
  lines.push(alignRight('TOTAL: ' + formatCurrency(saleData.total), width));

  // Payment info (if provided)
  if (saleData.amountPaid && saleData.amountPaid > 0) {
    lines.push('');
    lines.push(alignRight('Pago: ' + formatCurrency(saleData.amountPaid), width));
    if (saleData.change !== undefined && saleData.change >= 0) {
      lines.push(alignRight('Troco: ' + formatCurrency(saleData.change), width));
    }
  }

  // Footer
  lines.push(separator);
  lines.push(formatDateTime(new Date()));

  if (cfg.showOperator && saleData.operatorName) {
    lines.push('Operador: ' + removeAccents(saleData.operatorName));
  }

  lines.push('');
  if (cfg.footerMessage) {
    lines.push(center(removeAccents(cfg.footerMessage), width));
  }
  lines.push(separator);

  return lines.join('\n');
}

/**
 * Generate a simple text receipt for preview
 * @param {Object} saleData - Sale data
 * @param {Object} config - Configuration options
 * @returns {Object} Object with receipt text and metadata
 */
function generateReceiptPreview(saleData, config = {}) {
  const receiptText = generateReceipt(saleData, config);
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    text: receiptText,
    width: PAPER_CHARS[cfg.paperWidth] || 42,
    paperSize: cfg.paperWidth,
    lineCount: receiptText.split('\n').length
  };
}

/**
 * Get default configuration
 * @returns {Object} Default configuration
 */
function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

module.exports = {
  generateReceipt,
  generateReceiptPreview,
  getDefaultConfig,
  truncate,
  alignRight,
  alignLeft,
  center,
  formatValue,
  formatCurrency,
  removeAccents,
  formatDateTime
};
