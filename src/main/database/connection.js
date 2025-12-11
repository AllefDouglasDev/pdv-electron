const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

/**
 * Get the database file path
 * Uses app.getPath('userData') in production, local path in development
 * @returns {string} Path to the database file
 */
function getDatabasePath() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'mercado.db');
  }
  return path.join(__dirname, '../../../mercado.db');
}

/**
 * Initialize database connection
 * Creates the database file if it doesn't exist
 * @returns {Database} The database instance
 */
function initDatabase() {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();

  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  return db;
}

/**
 * Get the current database instance
 * @returns {Database|null} The database instance or null if not initialized
 */
function getDatabase() {
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Check database integrity
 * @returns {boolean} True if database is healthy
 */
function checkIntegrity() {
  if (!db) {
    return false;
  }

  const result = db.pragma('integrity_check');
  return result[0].integrity_check === 'ok';
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getDatabasePath,
  checkIntegrity
};
