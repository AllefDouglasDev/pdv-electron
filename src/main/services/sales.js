const { getDatabase } = require('../database/connection');
const { round, calculateSubtotal } = require('../../shared/calculations');

/**
 * Sales service module
 * Handles all sales-related database operations
 */

/**
 * Get product by barcode for PDV
 * @param {string} barcode - Product barcode
 * @returns {Object} Result with product data or error
 */
function getProductByBarcode(barcode) {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, barcode, purchase_price, sale_price, quantity
      FROM products
      WHERE barcode = ?
    `);
    const product = stmt.get(barcode);

    if (!product) {
      return { success: false, error: 'Produto nao encontrado!' };
    }

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchase_price,
        salePrice: product.sale_price,
        quantity: product.quantity
      }
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return { success: false, error: 'Erro ao buscar produto' };
  }
}

/**
 * Check stock availability for a product
 * @param {number} productId - Product ID
 * @param {number} requiredQuantity - Required quantity
 * @returns {Object} Result with availability status
 */
function checkStock(productId, requiredQuantity) {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT quantity FROM products WHERE id = ?');
    const product = stmt.get(productId);

    if (!product) {
      return { success: false, error: 'Produto nao encontrado' };
    }

    return {
      success: true,
      available: product.quantity >= requiredQuantity,
      currentStock: product.quantity
    };
  } catch (error) {
    console.error('Error checking stock:', error);
    return { success: false, error: 'Erro ao verificar estoque' };
  }
}

/**
 * Finalize a sale - register in database and update stock
 * @param {Array} items - Cart items
 * @param {number} userId - User ID who made the sale
 * @param {number} discountPercent - Discount percentage applied
 * @returns {Object} Result with sale ID or error
 */
function finalizeSale(items, userId, discountPercent = 0) {
  const db = getDatabase();

  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    const saleTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const insertSale = db.prepare(`
      INSERT INTO sales (product_name, barcode, purchase_price, sale_price, quantity, total, sale_time, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products
      SET quantity = quantity - ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND quantity >= ?
    `);

    const saleIds = [];

    for (const item of items) {
      // Verify stock one more time before sale
      const stockCheck = checkStock(item.productId, item.quantity);
      if (!stockCheck.success || !stockCheck.available) {
        db.exec('ROLLBACK');
        return {
          success: false,
          error: `Estoque insuficiente para "${item.name}". Disponivel: ${stockCheck.currentStock || 0}`
        };
      }

      // Calculate final price with discount
      let finalSalePrice = item.salePrice;
      if (discountPercent > 0) {
        finalSalePrice = round(item.salePrice * (1 - discountPercent / 100));
      }
      const total = calculateSubtotal(finalSalePrice, item.quantity);

      // Insert sale record
      const result = insertSale.run(
        item.name,
        item.barcode,
        item.purchasePrice,
        finalSalePrice,
        item.quantity,
        total,
        saleTime,
        userId
      );
      saleIds.push(result.lastInsertRowid);

      // Update stock
      const updateResult = updateStock.run(item.quantity, item.productId, item.quantity);
      if (updateResult.changes === 0) {
        db.exec('ROLLBACK');
        return {
          success: false,
          error: `Falha ao atualizar estoque de "${item.name}". Verifique a disponibilidade.`
        };
      }
    }

    // Commit transaction
    db.exec('COMMIT');

    return {
      success: true,
      saleIds,
      message: 'Venda realizada com sucesso!'
    };
  } catch (error) {
    // Rollback on error
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error finalizing sale:', error);
    return { success: false, error: 'Erro ao finalizar venda' };
  }
}

/**
 * Get today's sales
 * @param {number} userId - Optional user ID to filter
 * @returns {Object} Result with sales list
 */
function getTodaySales(userId = null) {
  try {
    const db = getDatabase();
    let query = `
      SELECT s.*, u.username
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE DATE(s.created_at) = DATE('now', 'localtime')
    `;
    const params = [];

    if (userId) {
      query += ' AND s.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY s.created_at DESC';

    const stmt = db.prepare(query);
    const sales = stmt.all(...params);

    return {
      success: true,
      sales: sales.map(sale => ({
        id: sale.id,
        productName: sale.product_name,
        barcode: sale.barcode,
        purchasePrice: sale.purchase_price,
        salePrice: sale.sale_price,
        quantity: sale.quantity,
        total: sale.total,
        saleTime: sale.sale_time,
        userId: sale.user_id,
        username: sale.username,
        createdAt: sale.created_at
      }))
    };
  } catch (error) {
    console.error('Error fetching today sales:', error);
    return { success: false, error: 'Erro ao buscar vendas' };
  }
}

/**
 * Get sales summary for today
 * @returns {Object} Summary with totals
 */
function getTodaySummary() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(purchase_price * quantity), 0) as total_cost,
        COALESCE(SUM(total) - SUM(purchase_price * quantity), 0) as total_profit
      FROM sales
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `);
    const summary = stmt.get();

    return {
      success: true,
      summary: {
        totalItems: summary.total_items,
        totalRevenue: round(summary.total_revenue),
        totalCost: round(summary.total_cost),
        totalProfit: round(summary.total_profit)
      }
    };
  } catch (error) {
    console.error('Error fetching today summary:', error);
    return { success: false, error: 'Erro ao buscar resumo' };
  }
}

/**
 * Cancel a sale (admin only) - not implemented yet
 * This would restore stock and remove sale record
 */
function cancelSale(saleId) {
  // To be implemented if needed
  return { success: false, error: 'Funcao nao implementada' };
}

module.exports = {
  getProductByBarcode,
  checkStock,
  finalizeSale,
  getTodaySales,
  getTodaySummary,
  cancelSale
};
