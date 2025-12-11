/**
 * Products page script
 * Handles product CRUD operations and UI interactions
 */

// State
let currentPage = 1;
const pageSize = 20;
let totalProducts = 0;
let currentSearch = '';
let editingProductId = null;
let deletingProductId = null;

// DOM Elements
const btnBack = document.getElementById('btn-back');
const btnNewProduct = document.getElementById('btn-new-product');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const productsTableBody = document.getElementById('products-table-body');
const productsCount = document.getElementById('products-count');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');
const userInfo = document.getElementById('user-info');

// Modal elements
const productModal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const barcodeInput = document.getElementById('barcode');
const purchasePriceInput = document.getElementById('purchase-price');
const profitMarginInput = document.getElementById('profit-margin');
const quantityInput = document.getElementById('quantity');
const salePriceInput = document.getElementById('sale-price');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');

// Delete modal elements
const deleteModal = document.getElementById('delete-modal');
const deleteProductName = document.getElementById('delete-product-name');
const btnCloseDelete = document.getElementById('btn-close-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Toast elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

/**
 * Initialize the page
 */
async function init() {
  await checkAccess();
  await loadUserInfo();
  await loadProducts();
  setupEventListeners();
}

/**
 * Check if user has access to this page
 */
async function checkAccess() {
  const session = await window.api.auth.getSession();

  if (!session) {
    window.api.navigate('login');
    return;
  }

  // Only admin and manager can access products page
  if (!['admin', 'gerente'].includes(session.role)) {
    showToast('Acesso negado', 'error');
    setTimeout(() => {
      window.api.navigate('dashboard');
    }, 1500);
    return;
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
  productsTableBody.innerHTML = '<tr><td colspan="7" class="loading-row">Carregando produtos...</td></tr>';

  const offset = (currentPage - 1) * pageSize;
  const result = await window.api.products.list({
    search: currentSearch,
    limit: pageSize,
    offset: offset
  });

  if (!result.success) {
    productsTableBody.innerHTML = `<tr><td colspan="7" class="empty-row">${result.error}</td></tr>`;
    return;
  }

  // Get total count for pagination
  totalProducts = await window.api.products.count(currentSearch);

  if (result.products.length === 0) {
    productsTableBody.innerHTML = '<tr><td colspan="7" class="empty-row">Nenhum produto encontrado</td></tr>';
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
  productsTableBody.innerHTML = products.map(product => `
    <tr data-id="${product.id}">
      <td>${escapeHtml(product.name)}</td>
      <td><code>${escapeHtml(product.barcode)}</code></td>
      <td class="price-cell price-purchase">${formatCurrency(product.purchasePrice)}</td>
      <td><span class="margin-badge">${product.profitMargin}%</span></td>
      <td class="price-cell price-sale">${formatCurrency(product.salePrice)}</td>
      <td>${getStockBadge(product.quantity)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editProduct(${product.id})">Editar</button>
          <button class="btn-action btn-delete" onclick="confirmDelete(${product.id}, '${escapeHtml(product.name)}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

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

  // New product button
  btnNewProduct.addEventListener('click', openNewProductModal);

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

  // Modal close buttons
  btnCloseModal.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  productModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

  // Delete modal close buttons
  btnCloseDelete.addEventListener('click', closeDeleteModal);
  btnCancelDelete.addEventListener('click', closeDeleteModal);
  deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);
  btnConfirmDelete.addEventListener('click', deleteProduct);

  // Form submission
  productForm.addEventListener('submit', handleFormSubmit);

  // Real-time price calculation
  purchasePriceInput.addEventListener('input', calculateSalePrice);
  profitMarginInput.addEventListener('input', calculateSalePrice);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!productModal.classList.contains('hidden')) {
        closeModal();
      }
      if (!deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
      }
    }
  });
}

/**
 * Perform search
 */
function performSearch() {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  loadProducts();
}

/**
 * Open modal for new product
 */
function openNewProductModal() {
  editingProductId = null;
  modalTitle.textContent = 'Novo Produto';
  btnSave.textContent = 'Cadastrar';
  productForm.reset();
  productIdInput.value = '';
  salePriceInput.value = 'R$ 0,00';
  clearErrors();
  productModal.classList.remove('hidden');
  productNameInput.focus();
}

/**
 * Open modal for editing product
 */
async function editProduct(id) {
  const result = await window.api.products.getById(id);

  if (!result.success) {
    showToast(result.error, 'error');
    return;
  }

  editingProductId = id;
  modalTitle.textContent = 'Editar Produto';
  btnSave.textContent = 'Salvar';

  productIdInput.value = result.product.id;
  productNameInput.value = result.product.name;
  barcodeInput.value = result.product.barcode;
  purchasePriceInput.value = formatInputCurrency(result.product.purchasePrice);
  profitMarginInput.value = result.product.profitMargin;
  quantityInput.value = result.product.quantity;
  salePriceInput.value = formatCurrency(result.product.salePrice);

  clearErrors();
  productModal.classList.remove('hidden');
  productNameInput.focus();
}

/**
 * Close the product modal
 */
function closeModal() {
  productModal.classList.add('hidden');
  editingProductId = null;
  clearErrors();
}

/**
 * Open delete confirmation modal
 */
function confirmDelete(id, name) {
  deletingProductId = id;
  deleteProductName.textContent = name;
  deleteModal.classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deletingProductId = null;
}

/**
 * Delete product
 */
async function deleteProduct() {
  if (!deletingProductId) return;

  const result = await window.api.products.delete(deletingProductId);

  if (result.success) {
    showToast('Produto excluido com sucesso', 'success');
    closeDeleteModal();
    loadProducts();
  } else {
    showToast(result.error, 'error');
  }
}

/**
 * Calculate and display sale price in real-time
 */
function calculateSalePrice() {
  const purchasePrice = parseInputCurrency(purchasePriceInput.value);
  const profitMargin = parseInt(profitMarginInput.value) || 0;

  if (purchasePrice > 0 && profitMargin >= 0) {
    const salePrice = purchasePrice * (1 + profitMargin / 100);
    salePriceInput.value = formatCurrency(salePrice);
  } else {
    salePriceInput.value = 'R$ 0,00';
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const formData = {
    name: productNameInput.value.trim(),
    barcode: barcodeInput.value.trim(),
    purchasePrice: parseInputCurrency(purchasePriceInput.value),
    profitMargin: parseInt(profitMarginInput.value) || 0,
    quantity: parseInt(quantityInput.value) || 0
  };

  // Frontend validation
  const errors = validateForm(formData);
  if (errors.length > 0) {
    errors.forEach(error => showFieldError(error.field, error.message));
    return;
  }

  let result;
  if (editingProductId) {
    result = await window.api.products.update(editingProductId, formData);
  } else {
    result = await window.api.products.create(formData);
  }

  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    loadProducts();
  } else {
    // Handle specific field errors
    if (result.error.includes('codigo de barras')) {
      showFieldError('barcode', result.error);
    } else {
      showToast(result.error, 'error');
    }
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

  if (!data.barcode) {
    errors.push({ field: 'barcode', message: 'Informe o codigo de barras' });
  }

  if (!data.purchasePrice || data.purchasePrice <= 0) {
    errors.push({ field: 'purchase-price', message: 'Valor de compra deve ser maior que zero' });
  }

  if (data.profitMargin < 0) {
    errors.push({ field: 'profit-margin', message: 'Margem de lucro nao pode ser negativa' });
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
  const inputElement = document.getElementById(field) || document.getElementById(`product-${field}`);

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
  toast.classList.remove('hidden', 'success', 'error');
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
window.editProduct = editProduct;
window.confirmDelete = confirmDelete;

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', init);
