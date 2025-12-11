/**
 * PDV (Point of Sale) page logic
 */

// State
let cart = [];
let selectedItemIndex = -1;
let discountPercent = 0;
let clockInterval = null;

// DOM Elements
const barcodeInput = document.getElementById('barcode-input');
const btnAdd = document.getElementById('btn-add');
const cartTableBody = document.getElementById('cart-table-body');
const btnEditQty = document.getElementById('btn-edit-qty');
const btnRemove = document.getElementById('btn-remove');
const btnDiscount = document.getElementById('btn-discount');
const btnClear = document.getElementById('btn-clear');
const totalValue = document.getElementById('total-value');
const discountInfo = document.getElementById('discount-info');
const amountPaid = document.getElementById('amount-paid');
const btnCalcChange = document.getElementById('btn-calc-change');
const changeValue = document.getElementById('change-value');
const btnFinalize = document.getElementById('btn-finalize');
const userInfo = document.getElementById('user-info');
const clock = document.getElementById('clock');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Modals
const qtyModal = document.getElementById('qty-modal');
const discountModal = document.getElementById('discount-modal');
const removeModal = document.getElementById('remove-modal');
const stockAlertModal = document.getElementById('stock-alert-modal');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  startClock();
  setupEventListeners();
  barcodeInput.focus();
});

/**
 * Check user session and load user info
 */
async function checkSession() {
  const session = await window.api.auth.getSession();
  if (!session || !session.username) {
    window.api.navigate('login');
    return;
  }
  userInfo.textContent = `${session.fullName || session.username} (${getRoleName(session.role)})`;
}

/**
 * Get role display name in Portuguese
 */
function getRoleName(role) {
  const roles = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  };
  return roles[role] || role;
}

/**
 * Start real-time clock
 */
function startClock() {
  function updateClock() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clock.textContent = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Navigation
  document.getElementById('btn-back').addEventListener('click', () => {
    if (clockInterval) clearInterval(clockInterval);
    window.api.navigate('dashboard');
  });

  // Barcode input
  barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addProductByBarcode();
    }
  });

  btnAdd.addEventListener('click', addProductByBarcode);

  // Cart actions
  btnEditQty.addEventListener('click', openQtyModal);
  btnRemove.addEventListener('click', openRemoveModal);
  btnDiscount.addEventListener('click', openDiscountModal);
  btnClear.addEventListener('click', clearCart);

  // Payment
  amountPaid.addEventListener('input', formatAmountInput);
  amountPaid.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      calculateChange();
    }
  });
  btnCalcChange.addEventListener('click', calculateChange);
  btnFinalize.addEventListener('click', finalizeSale);

  // Quantity Modal
  document.getElementById('btn-close-qty').addEventListener('click', closeQtyModal);
  document.getElementById('btn-cancel-qty').addEventListener('click', closeQtyModal);
  document.getElementById('btn-confirm-qty').addEventListener('click', confirmQtyChange);
  qtyModal.querySelector('.modal-overlay').addEventListener('click', closeQtyModal);

  // Discount Modal
  document.getElementById('btn-close-discount').addEventListener('click', closeDiscountModal);
  document.getElementById('btn-cancel-discount').addEventListener('click', closeDiscountModal);
  document.getElementById('btn-confirm-discount').addEventListener('click', confirmDiscount);
  discountModal.querySelector('.modal-overlay').addEventListener('click', closeDiscountModal);
  document.getElementById('discount-percent').addEventListener('input', updateDiscountPreview);

  // Remove Modal
  document.getElementById('btn-close-remove').addEventListener('click', closeRemoveModal);
  document.getElementById('btn-cancel-remove').addEventListener('click', closeRemoveModal);
  document.getElementById('btn-confirm-remove').addEventListener('click', confirmRemove);
  removeModal.querySelector('.modal-overlay').addEventListener('click', closeRemoveModal);

  // Stock Alert Modal
  document.getElementById('btn-close-stock-alert').addEventListener('click', closeStockAlertModal);
  document.getElementById('btn-ok-stock-alert').addEventListener('click', closeStockAlertModal);
  stockAlertModal.querySelector('.modal-overlay').addEventListener('click', closeStockAlertModal);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
  // Ignore if inside input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') {
      e.target.blur();
      barcodeInput.focus();
    }
    return;
  }

  switch (e.key) {
    case 'F2':
      e.preventDefault();
      if (selectedItemIndex >= 0) openQtyModal();
      break;
    case 'Delete':
      e.preventDefault();
      if (selectedItemIndex >= 0) openRemoveModal();
      break;
    case 'F5':
      e.preventDefault();
      if (cart.length > 0) openDiscountModal();
      break;
    case 'F10':
      e.preventDefault();
      if (cart.length > 0) finalizeSale();
      break;
    case 'Escape':
      e.preventDefault();
      if (clockInterval) clearInterval(clockInterval);
      window.api.navigate('dashboard');
      break;
  }
}

/**
 * Add product to cart by barcode
 */
async function addProductByBarcode() {
  const barcode = barcodeInput.value.trim();

  if (!barcode) {
    showToast('Digite ou escaneie um codigo de barras', 'error');
    barcodeInput.focus();
    return;
  }

  const result = await window.api.sales.getProductByBarcode(barcode);

  if (!result.success) {
    showToast(result.error || 'Produto nao encontrado!', 'error');
    barcodeInput.select();
    return;
  }

  const product = result.product;

  // Check stock
  if (product.quantity <= 0) {
    showToast('Produto sem estoque!', 'error');
    barcodeInput.select();
    return;
  }

  // Check if product already in cart
  const existingIndex = cart.findIndex(item => item.productId === product.id);

  if (existingIndex >= 0) {
    // Check if we can add more
    const currentQty = cart[existingIndex].quantity;
    if (currentQty >= product.quantity) {
      showToast(`Estoque insuficiente! Disponivel: ${product.quantity}`, 'error');
      barcodeInput.select();
      return;
    }
    // Increment quantity
    cart[existingIndex].quantity++;
    cart[existingIndex].subtotal = round(cart[existingIndex].salePrice * cart[existingIndex].quantity);
  } else {
    // Add new item
    cart.push({
      productId: product.id,
      name: product.name,
      barcode: product.barcode,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      originalSalePrice: product.salePrice,
      quantity: 1,
      subtotal: product.salePrice,
      stockAvailable: product.quantity
    });
  }

  // Check for low stock warning
  if (product.quantity <= 5) {
    showStockAlert(`Estoque baixo para "${product.name}": apenas ${product.quantity} unidades disponiveis.`);
  }

  // Update UI
  renderCart();
  updateTotal();

  // Clear input and refocus
  barcodeInput.value = '';
  barcodeInput.focus();
}

/**
 * Render cart table
 */
function renderCart() {
  if (cart.length === 0) {
    cartTableBody.innerHTML = `
      <tr class="empty-cart-row">
        <td colspan="6">Carrinho vazio. Adicione produtos para comecar.</td>
      </tr>
    `;
    selectedItemIndex = -1;
    updateActionButtons();
    return;
  }

  cartTableBody.innerHTML = cart.map((item, index) => `
    <tr data-index="${index}" class="${index === selectedItemIndex ? 'selected' : ''}">
      <td class="col-select">
        <input type="radio" name="cart-item" class="row-radio" ${index === selectedItemIndex ? 'checked' : ''} />
      </td>
      <td class="col-name">${escapeHtml(item.name)}</td>
      <td class="col-barcode barcode-cell">${escapeHtml(truncateBarcode(item.barcode))}</td>
      <td class="col-qty">${item.quantity}</td>
      <td class="col-price">${formatCurrency(item.salePrice)}</td>
      <td class="col-subtotal">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('');

  // Add click listeners to rows
  cartTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const index = parseInt(row.dataset.index);
      selectItem(index);
    });
  });

  updateActionButtons();
}

/**
 * Select an item in the cart
 */
function selectItem(index) {
  selectedItemIndex = index;
  renderCart();
}

/**
 * Update action buttons state
 */
function updateActionButtons() {
  const hasSelection = selectedItemIndex >= 0 && selectedItemIndex < cart.length;
  btnEditQty.disabled = !hasSelection;
  btnRemove.disabled = !hasSelection;
}

/**
 * Update total display
 */
function updateTotal() {
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  totalValue.textContent = formatCurrency(total);

  if (discountPercent > 0) {
    discountInfo.textContent = `${discountPercent}% desconto`;
    discountInfo.classList.remove('hidden');
  } else {
    discountInfo.classList.add('hidden');
  }

  // Reset change
  changeValue.textContent = 'R$ 0,00';
  changeValue.classList.remove('negative');
}

/**
 * Get current total
 */
function getTotal() {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Calculate and display change
 */
function calculateChange() {
  const total = getTotal();
  const paid = parseMoneyInput(amountPaid.value);

  if (isNaN(paid) || paid < 0) {
    showToast('Informe um valor valido', 'error');
    return;
  }

  const change = paid - total;

  if (change < 0) {
    changeValue.textContent = formatCurrency(Math.abs(change));
    changeValue.classList.add('negative');
  } else {
    changeValue.textContent = formatCurrency(change);
    changeValue.classList.remove('negative');
  }
}

/**
 * Format amount input as currency
 */
function formatAmountInput(e) {
  // Allow only numbers and comma/dot
  let value = e.target.value.replace(/[^\d,\.]/g, '');
  // Replace multiple separators
  const parts = value.split(/[,\.]/);
  if (parts.length > 2) {
    value = parts[0] + ',' + parts.slice(1).join('');
  }
  e.target.value = value;
}

/**
 * Open quantity edit modal
 */
function openQtyModal() {
  if (selectedItemIndex < 0 || selectedItemIndex >= cart.length) return;

  const item = cart[selectedItemIndex];
  document.getElementById('qty-product-name').textContent = item.name;
  document.getElementById('qty-stock-available').textContent = item.stockAvailable;
  document.getElementById('new-quantity').value = item.quantity;
  document.getElementById('new-quantity').max = item.stockAvailable;

  qtyModal.classList.remove('hidden');
  document.getElementById('new-quantity').focus();
  document.getElementById('new-quantity').select();
}

/**
 * Close quantity edit modal
 */
function closeQtyModal() {
  qtyModal.classList.add('hidden');
  barcodeInput.focus();
}

/**
 * Confirm quantity change
 */
function confirmQtyChange() {
  const newQty = parseInt(document.getElementById('new-quantity').value);
  const item = cart[selectedItemIndex];

  if (isNaN(newQty) || newQty < 0) {
    showToast('Informe uma quantidade valida', 'error');
    return;
  }

  if (newQty === 0) {
    // Remove item
    cart.splice(selectedItemIndex, 1);
    selectedItemIndex = -1;
    showToast('Item removido do carrinho', 'success');
  } else if (newQty > item.stockAvailable) {
    showToast(`Estoque insuficiente! Disponivel: ${item.stockAvailable}`, 'error');
    return;
  } else {
    // Update quantity
    item.quantity = newQty;
    item.subtotal = round(item.salePrice * newQty);
    showToast('Quantidade atualizada', 'success');
  }

  renderCart();
  updateTotal();
  closeQtyModal();
}

/**
 * Open discount modal
 */
function openDiscountModal() {
  if (cart.length === 0) {
    showToast('Adicione produtos antes de aplicar desconto', 'error');
    return;
  }

  document.getElementById('discount-current-total').textContent = formatCurrency(getTotal());
  document.getElementById('discount-percent').value = discountPercent;
  updateDiscountPreview();

  discountModal.classList.remove('hidden');
  document.getElementById('discount-percent').focus();
  document.getElementById('discount-percent').select();
}

/**
 * Close discount modal
 */
function closeDiscountModal() {
  discountModal.classList.add('hidden');
  barcodeInput.focus();
}

/**
 * Update discount preview in modal
 */
function updateDiscountPreview() {
  const percent = parseFloat(document.getElementById('discount-percent').value) || 0;
  const currentTotal = cart.reduce((sum, item) => sum + (item.originalSalePrice * item.quantity), 0);
  const newTotal = currentTotal * (1 - percent / 100);
  document.getElementById('discount-new-total').textContent = formatCurrency(newTotal);
}

/**
 * Confirm discount application
 */
function confirmDiscount() {
  const percent = parseFloat(document.getElementById('discount-percent').value);

  if (isNaN(percent) || percent < 0 || percent > 50) {
    showToast('Informe um desconto entre 0% e 50%', 'error');
    return;
  }

  discountPercent = percent;

  // Apply discount to all items
  cart.forEach(item => {
    item.salePrice = round(item.originalSalePrice * (1 - percent / 100));
    item.subtotal = round(item.salePrice * item.quantity);
  });

  renderCart();
  updateTotal();
  closeDiscountModal();

  if (percent > 0) {
    showToast(`Desconto de ${percent}% aplicado`, 'success');
  } else {
    showToast('Desconto removido', 'success');
  }
}

/**
 * Open remove confirmation modal
 */
function openRemoveModal() {
  if (selectedItemIndex < 0 || selectedItemIndex >= cart.length) return;

  const item = cart[selectedItemIndex];
  document.getElementById('remove-product-name').textContent = item.name;
  removeModal.classList.remove('hidden');
}

/**
 * Close remove confirmation modal
 */
function closeRemoveModal() {
  removeModal.classList.add('hidden');
  barcodeInput.focus();
}

/**
 * Confirm item removal
 */
function confirmRemove() {
  cart.splice(selectedItemIndex, 1);
  selectedItemIndex = -1;

  renderCart();
  updateTotal();
  closeRemoveModal();
  showToast('Item removido do carrinho', 'success');
}

/**
 * Clear entire cart
 */
function clearCart() {
  if (cart.length === 0) return;

  cart = [];
  selectedItemIndex = -1;
  discountPercent = 0;
  amountPaid.value = '';

  renderCart();
  updateTotal();
  showToast('Carrinho limpo', 'success');
  barcodeInput.focus();
}

/**
 * Finalize the sale
 */
async function finalizeSale() {
  if (cart.length === 0) {
    showToast('Adicione produtos antes de finalizar', 'error');
    return;
  }

  // Prepare items for sale
  const saleItems = cart.map(item => ({
    productId: item.productId,
    name: item.name,
    barcode: item.barcode,
    purchasePrice: item.purchasePrice,
    salePrice: item.salePrice,
    quantity: item.quantity
  }));

  // Disable finalize button during processing
  btnFinalize.disabled = true;
  btnFinalize.textContent = 'Processando...';

  try {
    const result = await window.api.sales.finalize(saleItems, discountPercent);

    if (!result.success) {
      showToast(result.error || 'Erro ao finalizar venda', 'error');
      return;
    }

    // Success - clear cart and show message
    cart = [];
    selectedItemIndex = -1;
    discountPercent = 0;
    amountPaid.value = '';

    renderCart();
    updateTotal();
    showToast('Venda realizada com sucesso!', 'success');
    barcodeInput.focus();
  } catch (error) {
    showToast('Erro ao finalizar venda', 'error');
    console.error('Error finalizing sale:', error);
  } finally {
    btnFinalize.disabled = false;
    btnFinalize.textContent = 'FINALIZAR VENDA (F10)';
  }
}

/**
 * Show low stock alert
 */
function showStockAlert(message) {
  document.getElementById('stock-alert-message').textContent = message;
  stockAlertModal.classList.remove('hidden');
}

/**
 * Close stock alert modal
 */
function closeStockAlertModal() {
  stockAlertModal.classList.add('hidden');
  barcodeInput.focus();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Utility functions

/**
 * Format currency (Brazilian Real)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Parse money input (accepts both comma and dot)
 */
function parseMoneyInput(value) {
  if (!value) return 0;
  // Replace comma with dot and parse
  return parseFloat(value.replace(',', '.'));
}

/**
 * Round to 2 decimal places
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Truncate barcode for display
 */
function truncateBarcode(barcode) {
  if (!barcode) return '';
  if (barcode.length > 15) {
    return barcode.substring(0, 12) + '...';
  }
  return barcode;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
