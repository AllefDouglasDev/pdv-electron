const bcrypt = require('bcrypt');
const { getDatabase } = require('../database');

// Session storage (in memory)
let currentSession = null;

/**
 * Authenticate user with username and password
 * @param {string} username - The username
 * @param {string} password - The plain text password
 * @returns {Promise<object>} Result with success status and user data or error
 */
async function login(username, password) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Validate inputs
  if (!username || !username.trim()) {
    return {
      success: false,
      error: 'Informe o usuário'
    };
  }

  if (!password) {
    return {
      success: false,
      error: 'Informe a senha'
    };
  }

  if (password.length < 4) {
    return {
      success: false,
      error: 'Senha muito curta'
    };
  }

  try {
    // Find user by username
    const stmt = db.prepare(`
      SELECT id, username, password_hash, full_name, role, is_active
      FROM users
      WHERE username = ?
      LIMIT 1
    `);

    const user = stmt.get(username.trim());

    // User not found - return generic error for security
    if (!user) {
      return {
        success: false,
        error: 'Usuário ou senha inválidos'
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        error: 'Usuário inativo. Contate o administrador'
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return {
        success: false,
        error: 'Usuário ou senha inválidos'
      };
    }

    // Create session
    currentSession = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      loginTime: new Date().toISOString()
    };

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Erro ao processar login. Tente novamente'
    };
  }
}

/**
 * Logout current user
 */
function logout() {
  currentSession = null;
}

/**
 * Get current session
 * @returns {object|null} Current session or null if not logged in
 */
function getSession() {
  return currentSession;
}

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
function isLoggedIn() {
  return currentSession !== null;
}

/**
 * Check if current user has a specific role
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean} True if user has one of the roles
 */
function hasRole(roles) {
  if (!currentSession) {
    return false;
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(currentSession.role);
}

/**
 * Check if current user can access admin features
 * @returns {boolean} True if user is admin
 */
function isAdmin() {
  return hasRole('admin');
}

/**
 * Check if current user can access manager features
 * @returns {boolean} True if user is admin or manager
 */
function isManager() {
  return hasRole(['admin', 'gerente']);
}

module.exports = {
  login,
  logout,
  getSession,
  isLoggedIn,
  hasRole,
  isAdmin,
  isManager
};
