const { getDatabase } = require('../database/connection');
const { round } = require('../../shared/calculations');

/**
 * Reports service module
 * Handles sales reports and cash register closing operations
 */

/**
 * Get all sales since last cash register closing
 * @returns {Object} Result with sales list
 */
function getAllSales() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        id,
        product_name,
        barcode,
        purchase_price,
        sale_price,
        quantity,
        total,
        sale_time,
        user_id,
        created_at
      FROM sales
      ORDER BY created_at ASC
    `);
    const sales = stmt.all();

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
        createdAt: sale.created_at,
        profit: round((sale.sale_price - sale.purchase_price) * sale.quantity)
      }))
    };
  } catch (error) {
    console.error('Error fetching all sales:', error);
    return { success: false, error: 'Erro ao buscar vendas' };
  }
}

/**
 * Get sales summary for reports
 * @returns {Object} Summary with totals
 */
function getSalesSummary() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(purchase_price * quantity), 0) as total_cost,
        COALESCE(SUM(total) - SUM(purchase_price * quantity), 0) as total_profit
      FROM sales
    `);
    const summary = stmt.get();

    return {
      success: true,
      summary: {
        totalItems: summary.total_items,
        totalQuantity: summary.total_quantity,
        totalRevenue: round(summary.total_revenue),
        totalCost: round(summary.total_cost),
        totalProfit: round(summary.total_profit)
      }
    };
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return { success: false, error: 'Erro ao buscar resumo de vendas' };
  }
}

/**
 * Close cash register - deletes all sales records
 * @returns {Object} Result with success status
 */
function closeCashRegister() {
  const db = getDatabase();

  try {
    // Get summary before closing for return
    const summaryResult = getSalesSummary();
    if (!summaryResult.success) {
      return { success: false, error: 'Erro ao obter resumo antes do fechamento' };
    }

    // Check if there are sales to close
    if (summaryResult.summary.totalItems === 0) {
      return { success: false, error: 'Nao ha vendas para fechar' };
    }

    // Delete all sales
    db.exec('BEGIN TRANSACTION');

    const deleteStmt = db.prepare('DELETE FROM sales');
    const result = deleteStmt.run();

    db.exec('COMMIT');

    return {
      success: true,
      message: 'Caixa fechado com sucesso!',
      closedSummary: summaryResult.summary,
      deletedRecords: result.changes
    };
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error closing cash register:', error);
    return { success: false, error: 'Erro ao fechar caixa' };
  }
}

/**
 * Get sales count
 * @returns {Object} Result with count
 */
function getSalesCount() {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM sales');
    const result = stmt.get();

    return {
      success: true,
      count: result.count
    };
  } catch (error) {
    console.error('Error counting sales:', error);
    return { success: false, error: 'Erro ao contar vendas' };
  }
}

module.exports = {
  getAllSales,
  getSalesSummary,
  closeCashRegister,
  getSalesCount
};
