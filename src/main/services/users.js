const bcrypt = require('bcrypt');
const { getDatabase } = require('../database');
const authService = require('./auth');

const SALT_ROUNDS = 10;

/**
 * List all users
 * @param {string} search - Optional search term for username or full_name
 * @returns {object} Result with success status and users array
 */
function list(search = '') {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  try {
    let stmt;
    let users;

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      stmt = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at, updated_at
        FROM users
        WHERE username LIKE ? OR full_name LIKE ?
        ORDER BY username ASC
      `);
      users = stmt.all(searchTerm, searchTerm);
    } else {
      stmt = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at, updated_at
        FROM users
        ORDER BY username ASC
      `);
      users = stmt.all();
    }

    return {
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active === 1,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      success: false,
      error: 'Erro ao listar usuários'
    };
  }
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {object} Result with success status and user data
 */
function getById(id) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  try {
    const stmt = db.prepare(`
      SELECT id, username, full_name, role, is_active
      FROM users
      WHERE id = ?
    `);

    const user = stmt.get(id);

    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active === 1
      }
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      success: false,
      error: 'Erro ao buscar usuário'
    };
  }
}

/**
 * Check if username already exists
 * @param {string} username - Username to check
 * @param {number} excludeId - Optional ID to exclude (for edit)
 * @returns {boolean} True if username exists
 */
function usernameExists(username, excludeId = null) {
  const db = getDatabase();

  if (!db) return false;

  try {
    let stmt;
    let result;

    if (excludeId) {
      stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE username = ? AND id != ?
      `);
      result = stmt.get(username, excludeId);
    } else {
      stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE username = ?
      `);
      result = stmt.get(username);
    }

    return result.count > 0;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Count active admins
 * @returns {number} Number of active admins
 */
function countActiveAdmins() {
  const db = getDatabase();

  if (!db) return 0;

  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'admin' AND is_active = 1
    `);
    const result = stmt.get();
    return result.count;
  } catch (error) {
    console.error('Error counting admins:', error);
    return 0;
  }
}

/**
 * Validate user data
 * @param {object} data - User data to validate
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {object} Validation result with errors array
 */
function validateUserData(data, isEdit = false) {
  const errors = [];

  // Username validation
  if (!data.username || !data.username.trim()) {
    errors.push('Informe o usuário');
  } else {
    const username = data.username.trim();
    if (username.length < 3) {
      errors.push('Usuário deve ter pelo menos 3 caracteres');
    } else if (username.length > 50) {
      errors.push('Usuário deve ter no máximo 50 caracteres');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Usuário deve conter apenas letras, números e underscore');
    }
  }

  // Full name validation
  if (!data.fullName || !data.fullName.trim()) {
    errors.push('Informe o nome completo');
  } else {
    const fullName = data.fullName.trim();
    if (fullName.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    } else if (fullName.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
  }

  // Password validation (required only for create)
  if (!isEdit) {
    if (!data.password) {
      errors.push('Informe a senha');
    } else if (data.password.length < 4) {
      errors.push('Senha deve ter pelo menos 4 caracteres');
    }

    if (data.password && data.password !== data.confirmPassword) {
      errors.push('As senhas não conferem');
    }
  } else {
    // For edit, password is optional but must be valid if provided
    if (data.password && data.password.length > 0 && data.password.length < 4) {
      errors.push('Senha deve ter pelo menos 4 caracteres');
    }
    if (data.password && data.password !== data.confirmPassword) {
      errors.push('As senhas não conferem');
    }
  }

  // Role validation
  const validRoles = ['admin', 'gerente', 'operador'];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.push('Selecione um perfil válido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a new user
 * @param {object} data - User data
 * @returns {Promise<object>} Result with success status
 */
async function create(data) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Validate data
  const validation = validateUserData(data, false);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors
    };
  }

  const username = data.username.trim().toLowerCase();

  // Check if username already exists
  if (usernameExists(username)) {
    return {
      success: false,
      error: 'Este usuário já existe'
    };
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const stmt = db.prepare(`
      INSERT INTO users (username, full_name, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `);

    const result = stmt.run(
      username,
      data.fullName.trim(),
      passwordHash,
      data.role,
      data.isActive !== false ? 1 : 0
    );

    return {
      success: true,
      id: result.lastInsertRowid,
      message: 'Usuário criado com sucesso'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: 'Erro ao criar usuário'
    };
  }
}

/**
 * Update an existing user
 * @param {number} id - User ID
 * @param {object} data - User data to update
 * @returns {Promise<object>} Result with success status
 */
async function update(id, data) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Check if user exists
  const existingUser = getById(id);
  if (!existingUser.success) {
    return existingUser;
  }

  // Get current session
  const session = authService.getSession();

  // Prevent self-deactivation
  if (session && session.id === id && data.isActive === false) {
    return {
      success: false,
      error: 'Você não pode desativar seu próprio usuário'
    };
  }

  // Check if changing role from admin
  if (existingUser.user.role === 'admin' && data.role !== 'admin') {
    const activeAdmins = countActiveAdmins();
    if (activeAdmins <= 1) {
      return {
        success: false,
        error: 'Deve haver pelo menos um administrador ativo no sistema'
      };
    }
  }

  // Check if deactivating an admin
  if (existingUser.user.role === 'admin' && existingUser.user.isActive && data.isActive === false) {
    const activeAdmins = countActiveAdmins();
    if (activeAdmins <= 1) {
      return {
        success: false,
        error: 'Deve haver pelo menos um administrador ativo no sistema'
      };
    }
  }

  // Validate data
  const validation = validateUserData(data, true);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors
    };
  }

  try {
    if (data.password && data.password.length > 0) {
      // Update with new password
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      const stmt = db.prepare(`
        UPDATE users
        SET full_name = ?,
            password_hash = ?,
            role = ?,
            is_active = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        data.fullName.trim(),
        passwordHash,
        data.role,
        data.isActive !== false ? 1 : 0,
        id
      );
    } else {
      // Update without changing password
      const stmt = db.prepare(`
        UPDATE users
        SET full_name = ?,
            role = ?,
            is_active = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        data.fullName.trim(),
        data.role,
        data.isActive !== false ? 1 : 0,
        id
      );
    }

    return {
      success: true,
      message: 'Usuário atualizado com sucesso'
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: 'Erro ao atualizar usuário'
    };
  }
}

/**
 * Delete a user
 * @param {number} id - User ID to delete
 * @returns {object} Result with success status
 */
function remove(id) {
  const db = getDatabase();

  if (!db) {
    return {
      success: false,
      error: 'Erro ao conectar com o banco de dados'
    };
  }

  // Get current session
  const session = authService.getSession();

  // Prevent self-deletion
  if (session && session.id === id) {
    return {
      success: false,
      error: 'Você não pode excluir seu próprio usuário'
    };
  }

  // Check if user exists
  const existingUser = getById(id);
  if (!existingUser.success) {
    return existingUser;
  }

  // Check if this is the last admin
  if (existingUser.user.role === 'admin' && existingUser.user.isActive) {
    const activeAdmins = countActiveAdmins();
    if (activeAdmins <= 1) {
      return {
        success: false,
        error: 'Não é possível excluir o único administrador do sistema'
      };
    }
  }

  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);

    return {
      success: true,
      message: 'Usuário excluído com sucesso'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: 'Erro ao excluir usuário'
    };
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  usernameExists,
  countActiveAdmins
};
