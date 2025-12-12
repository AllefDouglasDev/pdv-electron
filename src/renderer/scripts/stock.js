/**
 * Stock page script
 * Handles stock listing, searching, and editing operations
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
let currentPage = 1;
const pageSize = 20;
let totalProducts = 0;
let currentSearch = '';
let selectedProductId = null;
let canEdit = false;

// DOM Elements
const btnBack = document.getElementById('btn-back');
const btnListAll = document.getElementById('btn-list-all');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const stockTableBody = document.getElementById('stock-table-body');
const productsCount = document.getElementById('products-count');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');
const userInfo = document.getElementById('user-info');

// Edit form elements
const editSection = document.getElementById('edit-section');
const editForm = document.getElementById('edit-form');
const productIdInput = document.getElementById('product-id');
const editNameInput = document.getElementById('edit-name');
const editBarcodeInput = document.getElementById('edit-barcode');
const editPurchasePriceInput = document.getElementById('edit-purchase-price');
const editMarginInput = document.getElementById('edit-margin');
const editQuantityInput = document.getElementById('edit-quantity');
const editSalePriceInput = document.getElementById('edit-sale-price');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

// View only message
const viewOnlyMessage = document.getElementById('view-only-message');

// Toast elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

/**
 * Initialize the page
 */
async function init() {
  await checkAccess();
  await loadUserInfo();
  setupEventListeners();
  setupKeyboardShortcuts();
}

/**
 * Check if user has access and set edit permissions
 */
async function checkAccess() {
  const session = await window.api.auth.getSession();

  if (!session) {
    window.api.navigate('login');
    return;
  }

  // Admin and manager can edit, operator can only view
  canEdit = ['admin', 'gerente'].includes(session.role);

  if (canEdit) {
    editSection.classList.remove('hidden');
    viewOnlyMessage.classList.add('hidden');
  } else {
    editSection.classList.add('hidden');
    viewOnlyMessage.classList.remove('hidden');
  }
}

/**
 * Load and display current user info
 */
async function loadUserInfo() {
  const session = await window.api.auth.getSession();
  if (session) {
    const roleNames = {
      admin: 'Administrador',
      gerente: 'Gerente',
      operador: 'Operador'
    };
    userInfo.textContent = `${session.fullName} (${roleNames[session.role]})`;
  }
}

/**
 * Load products from the database
 */
async function loadProducts() {
  stockTableBody.innerHTML = '<tr><td colspan="5" class="loading-row">Carregando produtos...</td></tr>';

  const offset = (currentPage - 1) * pageSize;
  const result = await window.api.products.list({
    search: currentSearch,
    limit: pageSize,
    offset: offset
  });

  if (!result.success) {
    stockTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">${result.error}</td></tr>`;
    return;
  }

  // Get total count for pagination
  totalProducts = await window.api.products.count(currentSearch);

  if (result.products.length === 0) {
    stockTableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum produto encontrado</td></tr>';
    productsCount.textContent = '0 produtos';
    updatePagination();
    return;
  }

  renderProducts(result.products);
  updatePagination();
}

/**
 * Render products in the table
 */
function renderProducts(products) {
  stockTableBody.innerHTML = products.map(product => {
    const isLowStock = product.quantity <= 5;
    const isSelected = selectedProductId === product.id;
    const rowClasses = [
      isLowStock ? 'low-stock' : '',
      isSelected ? 'selected' : ''
    ].filter(Boolean).join(' ');

    return `
      <tr data-id="${product.id}" class="${rowClasses}" onclick="selectProduct(${product.id})">
        <td>${escapeHtml(product.name)}</td>
        <td><code>${escapeHtml(product.barcode)}</code></td>
        <td>${getStockBadge(product.quantity)}</td>
        <td><span class="margin-badge">${product.profitMargin}%</span></td>
        <td class="price-cell">${formatCurrency(product.salePrice)}</td>
      </tr>
    `;
  }).join('');

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalProducts);
  productsCount.textContent = `Exibindo ${start}-${end} de ${totalProducts} produtos`;
}

/**
 * Get stock badge HTML based on quantity
 */
function getStockBadge(quantity) {
  let className = 'stock-ok';
  if (quantity <= 0) {
    className = 'stock-critical';
  } else if (quantity <= 5) {
    className = 'stock-low';
  }
  return `<span class="stock-badge ${className}">${quantity}</span>`;
}

/**
 * Update pagination controls
 */
function updatePagination() {
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  pageInfo.textContent = `Pagina ${currentPage} de ${totalPages}`;
  btnPrev.disabled = currentPage <= 1;
  btnNext.disabled = currentPage >= totalPages;
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Navigation
  btnBack.addEventListener('click', () => {
    window.api.navigate('dashboard');
  });

  // List all products
  btnListAll.addEventListener('click', () => {
    currentSearch = '';
    searchInput.value = '';
    currentPage = 1;
    loadProducts();
  });

  // Search
  btnSearch.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Pagination
  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadProducts();
    }
  });

  btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(totalProducts / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      loadProducts();
    }
  });

  // Edit form
  if (canEdit) {
    btnClear.addEventListener('click', clearSelection);
    editForm.addEventListener('submit', handleFormSubmit);

    // Real-time price calculation
    editPurchasePriceInput.addEventListener('input', calculateSalePrice);
    editMarginInput.addEventListener('input', calculateSalePrice);
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // ESC - Clear selection
    if (e.key === 'Escape') {
      clearSelection();
    }

    // F5 - Refresh list
    if (e.key === 'F5') {
      e.preventDefault();
      loadProducts();
    }
  });
}

/**
 * Perform search by barcode
 */
function performSearch() {
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    showToast('Digite um codigo de barras para buscar', 'warning');
    return;
  }

  currentSearch = searchValue;
  currentPage = 1;
  loadProducts();
}

/**
 * Select a product from the table
 */
async function selectProduct(id) {
  if (!canEdit) {
    return;
  }

  const result = await window.api.products.getById(id);

  if (!result.success) {
    showToast(result.error, 'error');
    return;
  }

  selectedProductId = id;

  // Update table selection
  stockTableBody.querySelectorAll('tr').forEach(row => {
    row.classList.remove('selected');
    if (row.dataset.id === String(id)) {
      row.classList.add('selected');
    }
  });

  // Fill edit form
  productIdInput.value = result.product.id;
  editNameInput.value = result.product.name;
  editBarcodeInput.value = result.product.barcode;
  editPurchasePriceInput.value = formatInputCurrency(result.product.purchasePrice);
  editMarginInput.value = result.product.profitMargin;
  editQuantityInput.value = result.product.quantity;
  editSalePriceInput.value = formatCurrency(result.product.salePrice);

  clearErrors();

  // Focus on first editable field
  editNameInput.focus();
}

/**
 * Clear current selection
 */
function clearSelection() {
  selectedProductId = null;

  // Remove table selection
  stockTableBody.querySelectorAll('tr').forEach(row => {
    row.classList.remove('selected');
  });

  // Clear form
  editForm.reset();
  productIdInput.value = '';
  editBarcodeInput.value = '';
  editSalePriceInput.value = '';

  clearErrors();
}

/**
 * Calculate and display sale price in real-time
 */
function calculateSalePrice() {
  const purchasePrice = parseInputCurrency(editPurchasePriceInput.value);
  const profitMargin = parseInt(editMarginInput.value) || 0;

  if (purchasePrice > 0 && profitMargin >= 0) {
    const salePrice = purchasePrice * (1 + profitMargin / 100);
    editSalePriceInput.value = formatCurrency(salePrice);
  } else {
    editSalePriceInput.value = 'R$ 0,00';
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  if (!selectedProductId) {
    showToast('Selecione um produto para editar', 'warning');
    return;
  }

  const formData = {
    name: editNameInput.value.trim(),
    barcode: editBarcodeInput.value.trim(),
    purchasePrice: parseInputCurrency(editPurchasePriceInput.value),
    profitMargin: parseInt(editMarginInput.value) || 0,
    quantity: parseInt(editQuantityInput.value) || 0
  };

  // Frontend validation
  const errors = validateForm(formData);
  if (errors.length > 0) {
    errors.forEach(error => showFieldError(error.field, error.message));
    return;
  }

  // Disable button during save
  btnSave.disabled = true;
  btnSave.textContent = 'Salvando...';

  const result = await window.api.products.update(selectedProductId, formData);

  btnSave.disabled = false;
  btnSave.textContent = 'Salvar Alteracoes';

  if (result.success) {
    showToast('Produto atualizado com sucesso!', 'success');

    // Reload products to reflect changes
    await loadProducts();

    // Re-select the product to update form with fresh data
    await selectProduct(selectedProductId);
  } else {
    showToast(result.error, 'error');
  }
}

/**
 * Validate form data
 */
function validateForm(data) {
  const errors = [];

  if (!data.name) {
    errors.push({ field: 'name', message: 'Informe o nome do produto' });
  } else if (data.name.length < 2) {
    errors.push({ field: 'name', message: 'Nome muito curto' });
  }

  if (!data.purchasePrice || data.purchasePrice <= 0) {
    errors.push({ field: 'purchase-price', message: 'Valor de compra deve ser maior que zero' });
  }

  if (data.profitMargin < 0) {
    errors.push({ field: 'margin', message: 'Margem de lucro nao pode ser negativa' });
  }

  if (data.quantity < 0) {
    errors.push({ field: 'quantity', message: 'Quantidade nao pode ser negativa' });
  }

  return errors;
}

/**
 * Show field error
 */
function showFieldError(field, message) {
  const errorElement = document.getElementById(`${field}-error`);
  const inputElement = document.getElementById(`edit-${field}`);

  if (errorElement) {
    errorElement.textContent = message;
  }
  if (inputElement) {
    inputElement.classList.add('error');
  }
}

/**
 * Clear all field errors
 */
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  toast.classList.remove('hidden', 'success', 'error', 'warning');
  toast.classList.add(type);
  toastMessage.textContent = message;

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Format currency for display (Brazilian Real)
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

/**
 * Format currency for input field
 */
function formatInputCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,00';
  }
  return value.toFixed(2).replace('.', ',');
}

/**
 * Parse currency input value
 */
function parseInputCurrency(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string') {
    return 0;
  }

  // Remove R$ and spaces
  let cleaned = value.replace(/R\$\s*/g, '').trim();

  // Handle Brazilian format
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(',', '.');
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.selectProduct = selectProduct;

// Note: page initialization is handled by DOMContentLoaded at the top of this file
