const bcrypt = require('bcrypt');
const { getDatabase } = require('./connection');

const SALT_ROUNDS = 10;

/**
 * Create the default admin user if it doesn't exist
 * Default credentials: admin / admin
 */
async function seedAdminUser() {
  const db = getDatabase();

  // Check if admin user already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (existingAdmin) {
    return false;
  }

  // Generate password hash for 'admin'
  const passwordHash = await bcrypt.hash('admin', SALT_ROUNDS);

  // Insert admin user
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run('admin', passwordHash, 'Administrador', 'admin', 1);

  return true;
}

/**
 * Run all seed functions
 */
async function runSeeds() {
  const adminCreated = await seedAdminUser();
  return { adminCreated };
}

module.exports = {
  seedAdminUser,
  runSeeds
};
