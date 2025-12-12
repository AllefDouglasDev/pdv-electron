/**
 * Reports page script
 * Handles sales reports and cash register closing
 */

/* global SessionMonitor */

// Initialize session monitor on load
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof SessionMonitor !== 'undefined') {
    const sessionValid = await SessionMonitor.init();
    if (!sessionValid) return;
  }
  // Continue with page initialization
  init();
});

// State
let salesData = [];
let summaryData = null;
let isLoading = false;

// DOM Elements
const btnBack = document.getElementById('btn-back');
const btnLoad = document.getElementById('btn-load');
const btnCloseRegister = document.getElementById('btn-close-register');
const salesTableBody = document.getElementById('sales-table-body');
const currentDatetime = document.getElementById('current-datetime');

// Summary elements
const totalCostEl = document.getElementById('total-cost');
const totalRevenueEl = document.getElementById('total-revenue');
const totalProfitEl = document.getElementById('total-profit');
const totalItemsEl = document.getElementById('total-items');

// Modal elements
const modalCloseRegister = document.getElementById('modal-close-register');
const btnCancelClose = document.getElementById('btn-cancel-close');
const btnConfirmClose = document.getElementById('btn-confirm-close');
const modalTotalItems = document.getElementById('modal-total-items');
const modalTotalRevenue = document.getElementById('modal-total-revenue');
const modalTotalProfit = document.getElementById('modal-total-profit');

// Toast
const toast = document.getElementById('toast');

/**
 * Initialize page
 */
async function init() {
  // Check access permission
  const session = await window.api.auth.getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'gerente')) {
    showToast('Acesso negado!', 'error');
    setTimeout(() => {
      window.api.navigate('dashboard');
    }, 1500);
    return;
  }

  setupEventListeners();
  startClock();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Back button
  btnBack.addEventListener('click', () => {
    window.api.navigate('dashboard');
  });

  // Load sales button
  btnLoad.addEventListener('click', loadSales);

  // Close register button
  btnCloseRegister.addEventListener('click', showCloseModal);

  // Modal buttons
  btnCancelClose.addEventListener('click', hideCloseModal);
  btnConfirmClose.addEventListener('click', confirmCloseRegister);

  // Modal backdrop click
  modalCloseRegister.addEventListener('click', (e) => {
    if (e.target === modalCloseRegister) {
      hideCloseModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(e) {
  // F5 - Load sales
  if (e.key === 'F5') {
    e.preventDefault();
    loadSales();
  }

  // F10 - Close register
  if (e.key === 'F10') {
    e.preventDefault();
    if (!btnCloseRegister.disabled) {
      showCloseModal();
    }
  }

  // ESC - Close modal or go back
  if (e.key === 'Escape') {
    if (!modalCloseRegister.classList.contains('hidden')) {
      hideCloseModal();
    } else {
      window.api.navigate('dashboard');
    }
  }
}

/**
 * Start real-time clock
 */
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Update clock display
 */
function updateClock() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  currentDatetime.textContent = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Load sales data
 */
async function loadSales() {
  if (isLoading) return;

  isLoading = true;
  btnLoad.disabled = true;

  salesTableBody.innerHTML = `
    <tr class="loading-row">
      <td colspan="6">Carregando vendas...</td>
    </tr>
  `;

  try {
    // Load sales and summary in parallel
    const [salesResult, summaryResult] = await Promise.all([
      window.api.reports.getAllSales(),
      window.api.reports.getSummary()
    ]);

    if (!salesResult.success) {
      throw new Error(salesResult.error);
    }

    if (!summaryResult.success) {
      throw new Error(summaryResult.error);
    }

    salesData = salesResult.sales;
    summaryData = summaryResult.summary;

    renderSalesTable();
    renderSummary();

    // Enable close button if there are sales
    btnCloseRegister.disabled = salesData.length === 0;

    if (salesData.length === 0) {
      showToast('Nenhuma venda no período', 'warning');
    } else {
      showToast(`${salesData.length} vendas carregadas`, 'success');
    }
  } catch (error) {
    console.error('Error loading sales:', error);
    showToast(error.message || 'Erro ao carregar vendas', 'error');
    renderEmptyTable();
    resetSummary();
  } finally {
    isLoading = false;
    btnLoad.disabled = false;
  }
}

/**
 * Render sales table
 */
function renderSalesTable() {
  if (salesData.length === 0) {
    renderEmptyTable();
    return;
  }

  salesTableBody.innerHTML = salesData.map(sale => {
    const profitClass = sale.profit >= 0 ? 'profit-positive' : 'profit-negative';
    const time = sale.saleTime ? sale.saleTime.substring(11, 16) : '--:--';

    return `
      <tr>
        <td>${escapeHtml(sale.productName)}</td>
        <td class="price-cell cost-cell">${formatCurrency(sale.purchasePrice)}</td>
        <td>${sale.quantity}</td>
        <td class="price-cell sale-cell">${formatCurrency(sale.salePrice)}</td>
        <td class="profit-cell ${profitClass}">${formatCurrency(sale.profit)}</td>
        <td class="time-cell">${time}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Render empty table message
 */
function renderEmptyTable() {
  salesTableBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="6">Nenhuma venda no período</td>
    </tr>
  `;
}

/**
 * Render summary section
 */
function renderSummary() {
  if (!summaryData) {
    resetSummary();
    return;
  }

  totalCostEl.textContent = formatCurrency(summaryData.totalCost);
  totalRevenueEl.textContent = formatCurrency(summaryData.totalRevenue);
  totalProfitEl.textContent = formatCurrency(summaryData.totalProfit);

  // Update profit color based on value
  if (summaryData.totalProfit < 0) {
    totalProfitEl.style.color = '#e74c3c';
  } else {
    totalProfitEl.style.color = '';
  }

  const itemText = summaryData.totalQuantity === 1 ? 'item vendido' : 'itens vendidos';
  totalItemsEl.textContent = `${summaryData.totalQuantity} ${itemText}`;
}

/**
 * Reset summary to zero
 */
function resetSummary() {
  totalCostEl.textContent = 'R$ 0,00';
  totalRevenueEl.textContent = 'R$ 0,00';
  totalProfitEl.textContent = 'R$ 0,00';
  totalProfitEl.style.color = '';
  totalItemsEl.textContent = '0 itens vendidos';
}

/**
 * Show close register modal
 */
function showCloseModal() {
  if (!summaryData || salesData.length === 0) {
    showToast('Carregue as vendas primeiro', 'warning');
    return;
  }

  // Update modal summary
  modalTotalItems.textContent = summaryData.totalQuantity;
  modalTotalRevenue.textContent = formatCurrency(summaryData.totalRevenue);
  modalTotalProfit.textContent = formatCurrency(summaryData.totalProfit);

  modalCloseRegister.classList.remove('hidden');
  btnConfirmClose.focus();
}

/**
 * Hide close register modal
 */
function hideCloseModal() {
  modalCloseRegister.classList.add('hidden');
}

/**
 * Confirm and execute close register
 */
async function confirmCloseRegister() {
  btnConfirmClose.disabled = true;
  btnConfirmClose.textContent = 'Fechando...';

  try {
    const result = await window.api.reports.closeCashRegister();

    if (!result.success) {
      throw new Error(result.error);
    }

    hideCloseModal();
    showToast('Caixa fechado com sucesso!', 'success');

    // Reset state
    salesData = [];
    summaryData = null;
    renderEmptyTable();
    resetSummary();
    btnCloseRegister.disabled = true;
  } catch (error) {
    console.error('Error closing register:', error);
    showToast(error.message || 'Erro ao fechar caixa', 'error');
  } finally {
    btnConfirmClose.disabled = false;
    btnConfirmClose.textContent = 'Confirmar Fechamento';
  }
}

/**
 * Format value as Brazilian currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Note: page initialization is handled by DOMContentLoaded at the top of this file
