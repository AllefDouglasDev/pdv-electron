const { initDatabase, getDatabase, closeDatabase, checkIntegrity, getDatabasePath } = require('./connection');
const { initSchema } = require('./schema');
const { runSeeds } = require('./seed');

/**
 * Initialize the complete database:
 * 1. Create connection
 * 2. Create tables and indexes
 * 3. Seed initial data
 * @returns {Promise<object>} Initialization result
 */
async function initializeDatabase() {
  // Initialize connection
  initDatabase();

  // Create schema
  initSchema();

  // Run seeds
  const seedResult = await runSeeds();

  return {
    success: true,
    path: getDatabasePath(),
    ...seedResult
  };
}

module.exports = {
  initializeDatabase,
  initDatabase,
  getDatabase,
  closeDatabase,
  checkIntegrity,
  getDatabasePath,
  initSchema,
  runSeeds
};
