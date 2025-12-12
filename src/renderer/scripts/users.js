/**
 * Users management page script
 * Handles CRUD operations for users
 */

/* global SessionMonitor */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize session monitor
  if (typeof SessionMonitor !== 'undefined') {
    const sessionValid = await SessionMonitor.init();
    if (!sessionValid) return;
  }

  // DOM Elements
  const userInfo = document.getElementById('user-info');
  const btnBack = document.getElementById('btn-back');
  const btnNewUser = document.getElementById('btn-new-user');
  const searchInput = document.getElementById('search-input');
  const btnSearch = document.getElementById('btn-search');
  const usersTableBody = document.getElementById('users-table-body');
  const usersCount = document.getElementById('users-count');

  // Modal elements
  const userModal = document.getElementById('user-modal');
  const modalTitle = document.getElementById('modal-title');
  const userForm = document.getElementById('user-form');
  const userIdInput = document.getElementById('user-id');
  const usernameInput = document.getElementById('username');
  const fullNameInput = document.getElementById('full-name');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const roleSelect = document.getElementById('role');
  const isActiveCheckbox = document.getElementById('is-active');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel');
  const passwordRequired = document.getElementById('password-required');
  const confirmRequired = document.getElementById('confirm-required');
  const passwordHint = document.getElementById('password-hint');

  // Delete modal elements
  const deleteModal = document.getElementById('delete-modal');
  const deleteUsername = document.getElementById('delete-username');
  const btnCloseDelete = document.getElementById('btn-close-delete');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Toast element
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // State
  let currentUsers = [];
  let currentSession = null;
  let userToDelete = null;

  // Role labels in Portuguese
  const roleLabels = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  };

  /**
   * Check if user has access to this page
   */
  async function checkAccess() {
    try {
      currentSession = await window.api.auth.getSession();

      if (!currentSession) {
        await window.api.navigate('login');
        return false;
      }

      if (currentSession.role !== 'admin') {
        showToast('Acesso negado', 'error');
        await window.api.navigate('dashboard');
        return false;
      }

      const displayName = currentSession.fullName || currentSession.username;
      userInfo.textContent = `${displayName} (Administrador)`;
      return true;
    } catch (error) {
      console.error('Access check error:', error);
      await window.api.navigate('login');
      return false;
    }
  }

  /**
   * Load users list
   * @param {string} search - Optional search term
   */
  async function loadUsers(search = '') {
    try {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="loading-row">Carregando usuários...</td></tr>';

      const result = await window.api.users.list(search);

      if (!result.success) {
        usersTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">${result.error}</td></tr>`;
        usersCount.textContent = '';
        return;
      }

      currentUsers = result.users;

      if (currentUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum usuário encontrado</td></tr>';
        usersCount.textContent = '';
        return;
      }

      renderUsersTable();
      usersCount.textContent = `Mostrando ${currentUsers.length} usuário(s)`;
    } catch (error) {
      console.error('Error loading users:', error);
      usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Erro ao carregar usuários</td></tr>';
      usersCount.textContent = '';
    }
  }

  /**
   * Render users table
   */
  function renderUsersTable() {
    usersTableBody.innerHTML = currentUsers.map(user => `
      <tr data-id="${user.id}">
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.fullName)}</td>
        <td><span class="role-badge role-${user.role}">${roleLabels[user.role] || user.role}</span></td>
        <td><span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">${user.isActive ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${user.id}" title="Editar">Editar</button>
            <button class="btn-action btn-delete" data-id="${user.id}" data-username="${escapeHtml(user.username)}" title="Excluir">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Add event listeners for action buttons
    usersTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
    });

    usersTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id), btn.dataset.username));
    });
  }

  /**
   * Open modal for creating new user
   */
  function openCreateModal() {
    modalTitle.textContent = 'Novo Usuário';
    userIdInput.value = '';
    userForm.reset();
    usernameInput.disabled = false;
    isActiveCheckbox.checked = true;

    // Password is required for new users
    passwordRequired.style.display = 'inline';
    confirmRequired.style.display = 'inline';
    passwordHint.textContent = 'Mínimo 4 caracteres';

    clearFormErrors();
    showModal(userModal);
    usernameInput.focus();
  }

  /**
   * Open modal for editing user
   * @param {number} id - User ID
   */
  async function openEditModal(id) {
    try {
      const result = await window.api.users.getById(id);

      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }

      const user = result.user;

      modalTitle.textContent = 'Editar Usuário';
      userIdInput.value = user.id;
      usernameInput.value = user.username;
      usernameInput.disabled = true;
      fullNameInput.value = user.fullName;
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      roleSelect.value = user.role;
      isActiveCheckbox.checked = user.isActive;

      // Password is optional for edit
      passwordRequired.style.display = 'none';
      confirmRequired.style.display = 'none';
      passwordHint.textContent = 'Deixe em branco para manter a senha atual';

      clearFormErrors();
      showModal(userModal);
      fullNameInput.focus();
    } catch (error) {
      console.error('Error loading user:', error);
      showToast('Erro ao carregar usuário', 'error');
    }
  }

  /**
   * Open delete confirmation modal
   * @param {number} id - User ID
   * @param {string} username - Username for display
   */
  function openDeleteModal(id, username) {
    userToDelete = id;
    deleteUsername.textContent = username;
    showModal(deleteModal);
  }

  /**
   * Handle form submission (create/edit)
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    clearFormErrors();

    const isEdit = !!userIdInput.value;

    const data = {
      username: usernameInput.value.trim(),
      fullName: fullNameInput.value.trim(),
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
      role: roleSelect.value,
      isActive: isActiveCheckbox.checked
    };

    // Frontend validation
    const errors = validateForm(data, isEdit);
    if (errors.length > 0) {
      showFormErrors(errors);
      return;
    }

    try {
      let result;

      if (isEdit) {
        result = await window.api.users.update(parseInt(userIdInput.value), data);
      } else {
        result = await window.api.users.create(data);
      }

      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }

      showToast(result.message || (isEdit ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso'), 'success');
      closeModal(userModal);
      loadUsers(searchInput.value);
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Erro ao salvar usuário', 'error');
    }
  }

  /**
   * Handle delete confirmation
   */
  async function handleDelete() {
    if (!userToDelete) return;

    try {
      const result = await window.api.users.delete(userToDelete);

      if (!result.success) {
        showToast(result.error, 'error');
        closeModal(deleteModal);
        return;
      }

      showToast(result.message || 'Usuário excluído com sucesso', 'success');
      closeModal(deleteModal);
      loadUsers(searchInput.value);
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Erro ao excluir usuário', 'error');
    } finally {
      userToDelete = null;
    }
  }

  /**
   * Validate form data
   * @param {object} data - Form data
   * @param {boolean} isEdit - Whether this is an edit operation
   * @returns {Array} Array of error objects
   */
  function validateForm(data, isEdit) {
    const errors = [];

    // Username (only for create)
    if (!isEdit) {
      if (!data.username) {
        errors.push({ field: 'username', message: 'Informe o usuário' });
      } else if (data.username.length < 3) {
        errors.push({ field: 'username', message: 'Usuário deve ter pelo menos 3 caracteres' });
      } else if (data.username.length > 50) {
        errors.push({ field: 'username', message: 'Usuário deve ter no máximo 50 caracteres' });
      } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.push({ field: 'username', message: 'Usuário deve conter apenas letras, números e underscore' });
      }
    }

    // Full name
    if (!data.fullName) {
      errors.push({ field: 'full-name', message: 'Informe o nome completo' });
    } else if (data.fullName.length < 2) {
      errors.push({ field: 'full-name', message: 'Nome deve ter pelo menos 2 caracteres' });
    } else if (data.fullName.length > 100) {
      errors.push({ field: 'full-name', message: 'Nome deve ter no máximo 100 caracteres' });
    }

    // Password
    if (!isEdit) {
      if (!data.password) {
        errors.push({ field: 'password', message: 'Informe a senha' });
      } else if (data.password.length < 4) {
        errors.push({ field: 'password', message: 'Senha deve ter pelo menos 4 caracteres' });
      }

      if (data.password && data.password !== data.confirmPassword) {
        errors.push({ field: 'confirm-password', message: 'As senhas não conferem' });
      }
    } else {
      // For edit, validate only if password is provided
      if (data.password && data.password.length > 0 && data.password.length < 4) {
        errors.push({ field: 'password', message: 'Senha deve ter pelo menos 4 caracteres' });
      }
      if (data.password && data.password !== data.confirmPassword) {
        errors.push({ field: 'confirm-password', message: 'As senhas não conferem' });
      }
    }

    // Role
    if (!data.role) {
      errors.push({ field: 'role', message: 'Selecione um perfil' });
    }

    return errors;
  }

  /**
   * Show form validation errors
   * @param {Array} errors - Array of error objects
   */
  function showFormErrors(errors) {
    errors.forEach(error => {
      const input = document.getElementById(error.field);
      const errorSpan = document.getElementById(`${error.field}-error`);

      if (input) {
        input.classList.add('error');
      }
      if (errorSpan) {
        errorSpan.textContent = error.message;
      }
    });

    // Focus on first error field
    if (errors.length > 0) {
      const firstErrorInput = document.getElementById(errors[0].field);
      if (firstErrorInput) {
        firstErrorInput.focus();
      }
    }
  }

  /**
   * Clear form validation errors
   */
  function clearFormErrors() {
    const inputs = userForm.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.classList.remove('error');
    });

    const errorSpans = userForm.querySelectorAll('.field-error');
    errorSpans.forEach(span => {
      span.textContent = '';
    });
  }

  /**
   * Show modal
   * @param {HTMLElement} modal - Modal element
   */
  function showModal(modal) {
    modal.classList.remove('hidden');
  }

  /**
   * Close modal
   * @param {HTMLElement} modal - Modal element
   */
  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle search
   */
  function handleSearch() {
    loadUsers(searchInput.value.trim());
  }

  // Event listeners
  btnBack.addEventListener('click', () => window.api.navigate('dashboard'));
  btnNewUser.addEventListener('click', openCreateModal);
  btnSearch.addEventListener('click', handleSearch);

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // User modal events
  userForm.addEventListener('submit', handleFormSubmit);
  btnCloseModal.addEventListener('click', () => closeModal(userModal));
  btnCancel.addEventListener('click', () => closeModal(userModal));

  // Close modal on overlay click
  userModal.querySelector('.modal-overlay').addEventListener('click', () => closeModal(userModal));

  // Delete modal events
  btnCloseDelete.addEventListener('click', () => closeModal(deleteModal));
  btnCancelDelete.addEventListener('click', () => closeModal(deleteModal));
  btnConfirmDelete.addEventListener('click', handleDelete);
  deleteModal.querySelector('.modal-overlay').addEventListener('click', () => closeModal(deleteModal));

  // Clear error on input
  [usernameInput, fullNameInput, passwordInput, confirmPasswordInput, roleSelect].forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorSpan = document.getElementById(`${input.id}-error`);
      if (errorSpan) {
        errorSpan.textContent = '';
      }
    });
  });

  // Initialize
  const hasAccess = await checkAccess();
  if (hasAccess) {
    loadUsers();
  }
});
