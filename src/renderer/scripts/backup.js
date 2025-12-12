/* global SessionMonitor */

// DOM Elements
const btnBack = document.getElementById('btn-back');
const btnCreateBackup = document.getElementById('btn-create-backup');
const btnRefresh = document.getElementById('btn-refresh');
const userInfo = document.getElementById('user-info');
const tableBody = document.getElementById('backup-table-body');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statAutomatic = document.getElementById('stat-automatic');
const statManual = document.getElementById('stat-manual');
const statSize = document.getElementById('stat-size');

// Create Modal Elements
const createModal = document.getElementById('create-modal');
const btnCloseCreate = document.getElementById('btn-close-create');
const btnCancelCreate = document.getElementById('btn-cancel-create');
const btnConfirmCreate = document.getElementById('btn-confirm-create');

// Restore Modal Elements
const restoreModal = document.getElementById('restore-modal');
const btnCloseRestore = document.getElementById('btn-close-restore');
const btnCancelRestore = document.getElementById('btn-cancel-restore');
const btnConfirmRestore = document.getElementById('btn-confirm-restore');
const restoreFilename = document.getElementById('restore-filename');

// Delete Modal Elements
const deleteModal = document.getElementById('delete-modal');
const btnCloseDelete = document.getElementById('btn-close-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const deleteFilename = document.getElementById('delete-filename');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// State
let selectedBackup = null;

// Initialize
async function init() {
  // Check authentication
  const isLoggedIn = await window.api.auth.isLoggedIn();
  if (!isLoggedIn) {
    window.api.navigate('login');
    return;
  }

  // Check admin permission
  const session = await window.api.auth.getSession();
  if (!session || session.role !== 'admin') {
    showToast('Acesso negado. Apenas administradores podem acessar esta página.', 'error');
    setTimeout(() => window.api.navigate('dashboard'), 2000);
    return;
  }

  // Update user info
  userInfo.textContent = `${session.fullName} (${getRoleName(session.role)})`;

  // Load data
  await loadStats();
  await loadBackups();

  // Setup event listeners
  setupEventListeners();
}

// Get role name in Portuguese
function getRoleName(role) {
  const roles = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  };
  return roles[role] || role;
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  btnBack.addEventListener('click', () => window.api.navigate('dashboard'));

  // Toolbar
  btnCreateBackup.addEventListener('click', showCreateModal);
  btnRefresh.addEventListener('click', refreshData);

  // Create Modal
  btnCloseCreate.addEventListener('click', hideCreateModal);
  btnCancelCreate.addEventListener('click', hideCreateModal);
  btnConfirmCreate.addEventListener('click', createBackup);
  createModal.querySelector('.modal-overlay').addEventListener('click', hideCreateModal);

  // Restore Modal
  btnCloseRestore.addEventListener('click', hideRestoreModal);
  btnCancelRestore.addEventListener('click', hideRestoreModal);
  btnConfirmRestore.addEventListener('click', restoreBackup);
  restoreModal.querySelector('.modal-overlay').addEventListener('click', hideRestoreModal);

  // Delete Modal
  btnCloseDelete.addEventListener('click', hideDeleteModal);
  btnCancelDelete.addEventListener('click', hideDeleteModal);
  btnConfirmDelete.addEventListener('click', deleteBackup);
  deleteModal.querySelector('.modal-overlay').addEventListener('click', hideDeleteModal);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideCreateModal();
      hideRestoreModal();
      hideDeleteModal();
    }
    if (e.key === 'F5') {
      e.preventDefault();
      refreshData();
    }
  });
}

// Load stats
async function loadStats() {
  try {
    const result = await window.api.backup.getStats();
    if (result.success) {
      statTotal.textContent = result.stats.totalBackups;
      statAutomatic.textContent = result.stats.automaticBackups;
      statManual.textContent = result.stats.manualBackups;
      statSize.textContent = result.stats.totalSizeFormatted;
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// Load backups
async function loadBackups() {
  try {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-row">Carregando backups...</td></tr>';

    const result = await window.api.backup.list();
    if (!result.success) {
      tableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Erro: ${result.error}</td></tr>`;
      return;
    }

    if (result.backups.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum backup encontrado</td></tr>';
      return;
    }

    tableBody.innerHTML = result.backups.map(backup => createBackupRow(backup)).join('');

    // Add event listeners to action buttons
    document.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', () => showRestoreModal(btn.dataset.filename));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => showDeleteModal(btn.dataset.filename));
    });
  } catch (error) {
    console.error('Erro ao carregar backups:', error);
    tableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Erro ao carregar backups</td></tr>';
  }
}

// Create backup row HTML
function createBackupRow(backup) {
  const typeBadge = getTypeBadge(backup.type);
  const dateFormatted = formatDate(backup.createdAt);
  const canDelete = !backup.isInitial;

  return `
    <tr>
      <td class="filename-cell">${backup.filename}</td>
      <td>${typeBadge}</td>
      <td>${dateFormatted}</td>
      <td>${backup.sizeFormatted}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-restore" data-filename="${backup.filename}">
            Restaurar
          </button>
          <button class="btn-action btn-delete" data-filename="${backup.filename}" ${canDelete ? '' : 'disabled title="Backup inicial não pode ser excluído"'}>
            Excluir
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Get type badge HTML
function getTypeBadge(type) {
  const types = {
    automatic: { label: 'Automático', class: 'type-automatic' },
    manual: { label: 'Manual', class: 'type-manual' },
    initial: { label: 'Inicial', class: 'type-initial' },
    pre_restore: { label: 'Pré-restauração', class: 'type-pre_restore' }
  };

  const typeInfo = types[type] || { label: type, class: 'type-automatic' };
  return `<span class="type-badge ${typeInfo.class}">${typeInfo.label}</span>`;
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Refresh data
async function refreshData() {
  await loadStats();
  await loadBackups();
  showToast('Lista atualizada', 'success');
}

// Show create modal
function showCreateModal() {
  createModal.classList.remove('hidden');
}

// Hide create modal
function hideCreateModal() {
  createModal.classList.add('hidden');
}

// Create backup
async function createBackup() {
  try {
    btnConfirmCreate.disabled = true;
    btnConfirmCreate.textContent = 'Criando...';

    const result = await window.api.backup.createManual();

    if (result.success) {
      showToast(`Backup criado: ${result.filename}`, 'success');
      hideCreateModal();
      await refreshData();
    } else {
      showToast(`Erro: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast('Erro ao criar backup', 'error');
  } finally {
    btnConfirmCreate.disabled = false;
    btnConfirmCreate.textContent = 'Criar Backup';
  }
}

// Show restore modal
function showRestoreModal(filename) {
  selectedBackup = filename;
  restoreFilename.textContent = filename;
  restoreModal.classList.remove('hidden');
}

// Hide restore modal
function hideRestoreModal() {
  restoreModal.classList.add('hidden');
  selectedBackup = null;
}

// Restore backup
async function restoreBackup() {
  if (!selectedBackup) return;

  try {
    btnConfirmRestore.disabled = true;
    btnConfirmRestore.textContent = 'Restaurando...';

    const result = await window.api.backup.restore(selectedBackup);

    if (result.success) {
      showToast('Backup restaurado com sucesso! Reiniciando...', 'success');
      hideRestoreModal();
      // Wait a moment then reload
      setTimeout(() => {
        window.api.navigate('login');
      }, 2000);
    } else {
      showToast(`Erro: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast('Erro ao restaurar backup', 'error');
  } finally {
    btnConfirmRestore.disabled = false;
    btnConfirmRestore.textContent = 'Restaurar';
  }
}

// Show delete modal
function showDeleteModal(filename) {
  selectedBackup = filename;
  deleteFilename.textContent = filename;
  deleteModal.classList.remove('hidden');
}

// Hide delete modal
function hideDeleteModal() {
  deleteModal.classList.add('hidden');
  selectedBackup = null;
}

// Delete backup
async function deleteBackup() {
  if (!selectedBackup) return;

  try {
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.textContent = 'Excluindo...';

    const result = await window.api.backup.delete(selectedBackup);

    if (result.success) {
      showToast('Backup excluído com sucesso', 'success');
      hideDeleteModal();
      await refreshData();
    } else {
      showToast(`Erro: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast('Erro ao excluir backup', 'error');
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.textContent = 'Excluir';
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof SessionMonitor !== 'undefined') {
    const sessionValid = await SessionMonitor.init();
    if (!sessionValid) return;
  }
  init();
});
