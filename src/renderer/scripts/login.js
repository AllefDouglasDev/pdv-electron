/**
 * Login page script
 * Handles user authentication form submission
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btn-login');
  const errorMessage = document.getElementById('error-message');

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorMessage.hidden = true;
    errorMessage.textContent = '';
  }

  /**
   * Set loading state
   * @param {boolean} loading - Whether form is in loading state
   */
  function setLoading(loading) {
    btnLogin.disabled = loading;
    usernameInput.disabled = loading;
    passwordInput.disabled = loading;

    if (loading) {
      btnLogin.classList.add('loading');
      btnLogin.textContent = '';
    } else {
      btnLogin.classList.remove('loading');
      btnLogin.textContent = 'Entrar';
    }
  }

  /**
   * Validate form fields
   * @returns {object} Validation result with success and error
   */
  function validateForm() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Clear previous error states
    usernameInput.classList.remove('error');
    passwordInput.classList.remove('error');

    if (!username) {
      usernameInput.classList.add('error');
      return { success: false, error: 'Informe o usuário' };
    }

    if (username.length > 50) {
      usernameInput.classList.add('error');
      return { success: false, error: 'Usuário muito longo' };
    }

    if (!password) {
      passwordInput.classList.add('error');
      return { success: false, error: 'Informe a senha' };
    }

    if (password.length < 4) {
      passwordInput.classList.add('error');
      return { success: false, error: 'Senha muito curta' };
    }

    return { success: true };
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    hideError();

    // Validate form
    const validation = validateForm();
    if (!validation.success) {
      showError(validation.error);
      return;
    }

    setLoading(true);

    try {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      const result = await window.api.auth.login(username, password);

      if (result.success) {
        // Navigate to main dashboard
        await window.api.navigate('dashboard');
      } else {
        showError(result.error);
        // Focus on password field for retry
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Erro ao processar login. Tente novamente');
    } finally {
      setLoading(false);
    }
  }

  // Event listeners
  form.addEventListener('submit', handleSubmit);

  // Clear error when user starts typing
  usernameInput.addEventListener('input', () => {
    hideError();
    usernameInput.classList.remove('error');
  });

  passwordInput.addEventListener('input', () => {
    hideError();
    passwordInput.classList.remove('error');
  });

  // Focus on username input on page load
  usernameInput.focus();
});
