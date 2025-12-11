/**
 * Dashboard page script
 * Handles navigation, user info display, and clock
 */

document.addEventListener('DOMContentLoaded', async () => {
  const userInfo = document.getElementById('user-info');
  const btnLogout = document.getElementById('btn-logout');
  const currentTime = document.getElementById('current-time');
  const currentDate = document.getElementById('current-date');
  const navButtons = document.querySelectorAll('.nav-btn');
  const quickActionButtons = document.querySelectorAll('.quick-action-btn');

  // Role labels in Portuguese
  const roleLabels = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  };

  /**
   * Load and display user session info
   */
  async function loadUserInfo() {
    try {
      const session = await window.api.auth.getSession();

      if (!session) {
        // Not logged in, redirect to login
        await window.api.navigate('login');
        return;
      }

      const displayName = session.fullName || session.username;
      const roleLabel = roleLabels[session.role] || session.role;
      userInfo.textContent = `${displayName} (${roleLabel})`;

      // Apply role-based visibility
      applyRolePermissions(session.role);
    } catch (error) {
      console.error('Error loading user info:', error);
      userInfo.textContent = 'Erro ao carregar usuário';
    }
  }

  /**
   * Apply role-based visibility to menu items
   * @param {string} role - User's role
   */
  function applyRolePermissions(role) {
    const navItems = document.querySelectorAll('.nav-item[data-require-role]');

    navItems.forEach(item => {
      const requiredRoles = item.dataset.requireRole.split(',');
      if (!requiredRoles.includes(role)) {
        item.classList.add('hidden');
      }
    });
  }

  /**
   * Update clock display
   */
  function updateClock() {
    const now = new Date();

    // Format time as HH:MM:SS
    const time = now.toLocaleTimeString('pt-BR');
    currentTime.textContent = time;

    // Format date as DD/MM/YYYY
    const date = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    currentDate.textContent = date.charAt(0).toUpperCase() + date.slice(1);
  }

  /**
   * Handle navigation
   * @param {string} page - Page name to navigate to
   */
  async function navigateTo(page) {
    try {
      await window.api.navigate(page);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Erro ao navegar. Tente novamente.');
    }
  }

  /**
   * Handle logout
   */
  async function handleLogout() {
    try {
      await window.api.auth.logout();
      await window.api.navigate('login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Erro ao sair. Tente novamente.');
    }
  }

  // Event listeners for navigation buttons
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });

  // Event listeners for quick action buttons
  quickActionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });

  // Logout button
  btnLogout.addEventListener('click', handleLogout);

  // Initialize
  loadUserInfo();
  updateClock();

  // Update clock every second
  setInterval(updateClock, 1000);
});
