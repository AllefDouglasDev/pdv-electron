const { getDatabase } = require('../database');
const { calculateSalePrice, isValidMonetaryValue, isValidQuantity, isValidMargin } = require('../../shared/calculations');

/**
 * List all products with optional search
 * @param {object} options - Search options
 * @param {string} options.search - Search term for name or barcode
 * @param {number} options.limit - Max results (default: 100)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {object} Result with success status and products array
 */
function list(options = {}) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  const { search = '', limit = 100, offset = 0 } = options;

  try {
    let stmt;
    let products;

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      stmt = db.prepare(`
        SELECT id, name, barcode, purchase_price, profit_margin, sale_price, quantity, created_at, updated_at
        FROM products
        WHERE name LIKE ? OR barcode LIKE ?
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `);
      products = stmt.all(searchTerm, searchTerm, limit, offset);
    } else {
      stmt = db.prepare(`
        SELECT id, name, barcode, purchase_price, profit_margin, sale_price, quantity, created_at, updated_at
        FROM products
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `);
      products = stmt.all(limit, offset);
    }

    return {
      success: true,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchase_price,
        profitMargin: product.profit_margin,
        salePrice: product.sale_price,
        quantity: product.quantity,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }))
    };
  } catch (error) {
    console.error('Error listing products:', error);
    return {
      success: false,
      error: 'Erro ao listar produtos'
    };
  }
}

/**
 * Get product by ID
 * @param {number} id - Product ID
 * @returns {object} Result with success status and product data
 */
function getById(id) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  try {
    const stmt = db.prepare(`
      SELECT id, name, barcode, purchase_price, profit_margin, sale_price, quantity, created_at, updated_at
      FROM products
      WHERE id = ?
    `);

    const product = stmt.get(id);

    if (!product) {
      return {
        success: false,
        error: 'Produto não encontrado'
      };
    }

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchase_price,
        profitMargin: product.profit_margin,
        salePrice: product.sale_price,
        quantity: product.quantity,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    };
  } catch (error) {
    console.error('Error getting product:', error);
    return {
      success: false,
      error: 'Erro ao buscar produto'
    };
  }
}

/**
 * Get product by barcode
 * @param {string} barcode - Product barcode
 * @returns {object} Result with success status and product data
 */
function getByBarcode(barcode) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  try {
    const stmt = db.prepare(`
      SELECT id, name, barcode, purchase_price, profit_margin, sale_price, quantity, created_at, updated_at
      FROM products
      WHERE barcode = ?
    `);

    const product = stmt.get(barcode);

    if (!product) {
      return {
        success: false,
        error: 'Produto não encontrado'
      };
    }

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchase_price,
        profitMargin: product.profit_margin,
        salePrice: product.sale_price,
        quantity: product.quantity,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    };
  } catch (error) {
    console.error('Error getting product by barcode:', error);
    return {
      success: false,
      error: 'Erro ao buscar produto'
    };
  }
}

/**
 * Check if barcode already exists
 * @param {string} barcode - Barcode to check
 * @param {number} excludeId - Optional ID to exclude (for edit)
 * @returns {boolean} True if barcode exists
 */
function barcodeExists(barcode, excludeId = null) {
  const db = getDatabase();

  if (!db) return false;

  try {
    let stmt;
    let result;

    if (excludeId) {
      stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE barcode = ? AND id != ?
      `);
      result = stmt.get(barcode, excludeId);
    } else {
      stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE barcode = ?
      `);
      result = stmt.get(barcode);
    }

    return result.count > 0;
  } catch (error) {
    console.error('Error checking barcode:', error);
    return false;
  }
}

/**
 * Count total products
 * @param {string} search - Optional search term
 * @returns {number} Total count
 */
function count(search = '') {
  const db = getDatabase();

  if (!db) return 0;

  try {
    let stmt;
    let result;

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE name LIKE ? OR barcode LIKE ?
      `);
      result = stmt.get(searchTerm, searchTerm);
    } else {
      stmt = db.prepare(`SELECT COUNT(*) as count FROM products`);
      result = stmt.get();
    }

    return result.count;
  } catch (error) {
    console.error('Error counting products:', error);
    return 0;
  }
}

/**
 * Validate product data
 * @param {object} data - Product data to validate
 * @returns {object} Validation result with errors array
 */
function validateProductData(data) {
  const errors = [];

  // Name validation
  if (!data.name || !data.name.trim()) {
    errors.push('Informe o nome do produto');
  } else {
    const name = data.name.trim();
    if (name.length < 2) {
      errors.push('Nome muito curto');
    } else if (name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
  }

  // Barcode validation
  if (!data.barcode || !data.barcode.trim()) {
    errors.push('Informe o código de barras');
  } else {
    const barcode = data.barcode.trim();
    if (barcode.length > 50) {
      errors.push('Código de barras deve ter no máximo 50 caracteres');
    }
  }

  // Purchase price validation
  if (data.purchasePrice === undefined || data.purchasePrice === null || data.purchasePrice === '') {
    errors.push('Informe o valor de compra');
  } else {
    const purchasePrice = parseFloat(data.purchasePrice);
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      errors.push('Valor de compra deve ser maior que zero');
    } else if (!isValidMonetaryValue(purchasePrice)) {
      errors.push('Valor de compra inválido');
    }
  }

  // Profit margin validation
  if (data.profitMargin === undefined || data.profitMargin === null || data.profitMargin === '') {
    errors.push('Informe a margem de lucro');
  } else {
    const profitMargin = parseInt(data.profitMargin);
    if (isNaN(profitMargin) || profitMargin < 0) {
      errors.push('Margem de lucro não pode ser negativa');
    } else if (!isValidMargin(profitMargin)) {
      errors.push('Margem de lucro inválida (máximo 1000%)');
    }
  }

  // Quantity validation
  if (data.quantity === undefined || data.quantity === null || data.quantity === '') {
    errors.push('Informe a quantidade');
  } else {
    const quantity = parseInt(data.quantity);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Quantidade não pode ser negativa');
    } else if (quantity > 999999) {
      errors.push('Quantidade inválida');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a new product
 * @param {object} data - Product data
 * @returns {object} Result with success status
 */
function create(data) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Validate data
  const validation = validateProductData(data);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors
    };
  }

  const barcode = data.barcode.trim();

  // Check if barcode already exists
  if (barcodeExists(barcode)) {
    return {
      success: false,
      error: 'Este código de barras já está cadastrado'
    };
  }

  try {
    const name = data.name.trim();
    const purchasePrice = parseFloat(data.purchasePrice);
    const profitMargin = parseInt(data.profitMargin);
    const quantity = parseInt(data.quantity);

    // Calculate sale price
    const salePrice = calculateSalePrice(purchasePrice, profitMargin);

    const stmt = db.prepare(`
      INSERT INTO products (name, barcode, purchase_price, profit_margin, sale_price, quantity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `);

    const result = stmt.run(
      name,
      barcode,
      purchasePrice,
      profitMargin,
      salePrice,
      quantity
    );

    return {
      success: true,
      id: result.lastInsertRowid,
      message: 'Produto cadastrado com sucesso'
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      error: 'Erro ao cadastrar produto'
    };
  }
}

/**
 * Update an existing product
 * @param {number} id - Product ID
 * @param {object} data - Product data to update
 * @returns {object} Result with success status
 */
function update(id, data) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Check if product exists
  const existingProduct = getById(id);
  if (!existingProduct.success) {
    return existingProduct;
  }

  // Validate data
  const validation = validateProductData(data);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors
    };
  }

  const barcode = data.barcode.trim();

  // Check if barcode already exists (exclude current product)
  if (barcodeExists(barcode, id)) {
    return {
      success: false,
      error: 'Este código de barras já está cadastrado em outro produto'
    };
  }

  try {
    const name = data.name.trim();
    const purchasePrice = parseFloat(data.purchasePrice);
    const profitMargin = parseInt(data.profitMargin);
    const quantity = parseInt(data.quantity);

    // Calculate sale price
    const salePrice = calculateSalePrice(purchasePrice, profitMargin);

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?,
          barcode = ?,
          purchase_price = ?,
          profit_margin = ?,
          sale_price = ?,
          quantity = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(
      name,
      barcode,
      purchasePrice,
      profitMargin,
      salePrice,
      quantity,
      id
    );

    return {
      success: true,
      message: 'Produto atualizado com sucesso'
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error: 'Erro ao atualizar produto'
    };
  }
}

/**
 * Update product quantity (for stock management)
 * @param {number} id - Product ID
 * @param {number} quantityChange - Amount to add (positive) or subtract (negative)
 * @returns {object} Result with success status
 */
function updateQuantity(id, quantityChange) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Check if product exists
  const existingProduct = getById(id);
  if (!existingProduct.success) {
    return existingProduct;
  }

  const newQuantity = existingProduct.product.quantity + quantityChange;

  if (newQuantity < 0) {
    return {
      success: false,
      error: 'Estoque insuficiente'
    };
  }

  try {
    const stmt = db.prepare(`
      UPDATE products
      SET quantity = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(newQuantity, id);

    return {
      success: true,
      newQuantity,
      message: 'Quantidade atualizada com sucesso'
    };
  } catch (error) {
    console.error('Error updating quantity:', error);
    return {
      success: false,
      error: 'Erro ao atualizar quantidade'
    };
  }
}

/**
 * Delete a product
 * @param {number} id - Product ID to delete
 * @returns {object} Result with success status
 */
function remove(id) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Check if product exists
  const existingProduct = getById(id);
  if (!existingProduct.success) {
    return existingProduct;
  }

  try {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);

    return {
      success: true,
      message: 'Produto excluído com sucesso'
    };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: 'Erro ao excluir produto'
    };
  }
}

/**
 * Get products with low stock
 * @param {number} threshold - Stock threshold (default: 5)
 * @returns {object} Result with products array
 */
function getLowStock(threshold = 5) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  try {
    const stmt = db.prepare(`
      SELECT id, name, barcode, quantity
      FROM products
      WHERE quantity <= ?
      ORDER BY quantity ASC
    `);

    const products = stmt.all(threshold);

    return {
      success: true,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: product.quantity
      }))
    };
  } catch (error) {
    console.error('Error getting low stock products:', error);
    return {
      success: false,
      error: 'Erro ao buscar produtos com estoque baixo'
    };
  }
}

module.exports = {
  list,
  getById,
  getByBarcode,
  create,
  update,
  updateQuantity,
  remove,
  barcodeExists,
  count,
  getLowStock
};
