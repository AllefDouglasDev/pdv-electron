/**
 * Formatting utilities module
 * Handles currency formatting, input conversion, and display formatting
 */

/**
 * Format a number as Brazilian Real currency
 * Uses Intl.NumberFormat for proper locale formatting
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string (e.g., "R$ 1.234,56")
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Simple currency format without Intl
 * @param {number} value - The value to format
 * @returns {string} Formatted string (e.g., "R$ 10,50")
 */
function formatCurrencySimple(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }

  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

/**
 * Format a number as percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted percentage string (e.g., "50%")
 */
function formatPercentage(value, decimals = 0) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return value.toFixed(decimals) + '%';
}

/**
 * Convert user input to number
 * Handles Brazilian format (comma as decimal separator)
 * @param {string|number} value - The input value
 * @returns {number} Parsed number or NaN if invalid
 */
function parseInput(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return NaN;
  }

  // Trim whitespace
  let cleaned = value.trim();

  // Handle Brazilian format with thousands separator
  // E.g., "1.234,56" -> "1234.56"
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Assume format like "1.234,56" (Brazilian thousands + decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Simple comma to dot conversion
    cleaned = cleaned.replace(',', '.');
  }

  return parseFloat(cleaned);
}

/**
 * Format date for display in PT-BR format
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date (e.g., "10/12/2025")
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString('pt-BR');
}

/**
 * Format time for display
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted time (e.g., "14:35:22")
 */
function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleTimeString('pt-BR');
}

/**
 * Format date and time for display
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted datetime (e.g., "10/12/2025 14:35:22")
 */
function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleString('pt-BR');
}

/**
 * Get current time formatted as HH:mm:ss
 * @returns {string} Current time string
 */
function getCurrentTime() {
  return new Date().toLocaleTimeString('pt-BR');
}

/**
 * Get current date formatted as ISO (YYYY-MM-DD HH:MM:SS)
 * For database storage
 * @returns {string} ISO formatted datetime
 */
function getCurrentISODateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format quantity with unit
 * @param {number} quantity - The quantity
 * @param {string} unit - Unit label (default: "un")
 * @returns {string} Formatted quantity (e.g., "5 un")
 */
function formatQuantity(quantity, unit = 'un') {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    return '0 ' + unit;
  }

  return quantity + ' ' + unit;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Pad barcode with zeros
 * @param {string} barcode - Barcode string
 * @param {number} length - Target length (default: 13 for EAN-13)
 * @returns {string} Padded barcode
 */
function padBarcode(barcode, length = 13) {
  if (!barcode) {
    return '';
  }

  return barcode.padStart(length, '0');
}

module.exports = {
  formatCurrency,
  formatCurrencySimple,
  formatPercentage,
  parseInput,
  formatDate,
  formatTime,
  formatDateTime,
  getCurrentTime,
  getCurrentISODateTime,
  formatQuantity,
  truncateText,
  padBarcode
};
