const { getDatabase } = require('./connection');

/**
 * Create all database tables if they don't exist
 */
function createTables() {
  const db = getDatabase();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'operador'
        CHECK (role IN ('admin', 'gerente', 'operador')),
      is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      purchase_price REAL NOT NULL CHECK (purchase_price >= 0),
      profit_margin INTEGER NOT NULL CHECK (profit_margin >= 0),
      sale_price REAL NOT NULL CHECK (sale_price >= 0),
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total REAL NOT NULL,
      sale_time TEXT NOT NULL,
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

/**
 * Create all indexes for optimization
 */
function createIndexes() {
  const db = getDatabase();

  // Users indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

  // Products indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity)`);

  // Sales indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_barcode ON sales(barcode)`);
}

/**
 * Initialize database schema (tables and indexes)
 */
function initSchema() {
  createTables();
  createIndexes();
}

module.exports = {
  initSchema,
  createTables,
  createIndexes
};
