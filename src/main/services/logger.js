const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Log directory
let logDir;

/**
 * Initialize log directory
 */
function initLogDir() {
  if (!logDir) {
    const userDataPath = app.getPath('userData');
    logDir = path.join(userDataPath, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  return logDir;
}

/**
 * Get current date string for log filename
 * @returns {string} Date string in format YYYY-MM-DD
 */
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get log file path for current day
 * @returns {string} Full path to log file
 */
function getLogFilePath() {
  initLogDir();
  return path.join(logDir, `${getDateString()}.log`);
}

/**
 * Log types for critical actions
 */
const LogTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  SALE_COMPLETED: 'SALE_COMPLETED',
  CASH_REGISTER_CLOSED: 'CASH_REGISTER_CLOSED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
  BACKUP_DELETED: 'BACKUP_DELETED',
  ACCESS_DENIED: 'ACCESS_DENIED'
};

/**
 * Write a log entry
 * @param {string} type - Log type from LogTypes
 * @param {object} user - User object { id, username }
 * @param {object} details - Additional details
 */
function log(type, user, details = {}) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      user: user ? {
        id: user.id,
        username: user.username
      } : null,
      details
    };

    const line = JSON.stringify(entry) + '\n';
    const logPath = getLogFilePath();

    fs.appendFileSync(logPath, line, { encoding: 'utf8' });
  } catch (error) {
    console.error('Error writing log:', error);
  }
}

/**
 * Log login success
 * @param {object} user - User data
 */
function logLoginSuccess(user) {
  log(LogTypes.LOGIN_SUCCESS, user);
}

/**
 * Log login failure
 * @param {string} username - Attempted username
 * @param {string} reason - Failure reason
 */
function logLoginFailed(username, reason) {
  log(LogTypes.LOGIN_FAILED, null, { attemptedUsername: username, reason });
}

/**
 * Log logout
 * @param {object} user - User data
 */
function logLogout(user) {
  log(LogTypes.LOGOUT, user);
}

/**
 * Log session expired
 * @param {object} user - User data
 */
function logSessionExpired(user) {
  log(LogTypes.SESSION_EXPIRED, user);
}

/**
 * Log user creation
 * @param {object} admin - Admin who created
 * @param {object} newUser - New user data
 */
function logUserCreated(admin, newUser) {
  log(LogTypes.USER_CREATED, admin, {
    newUserId: newUser.id,
    newUsername: newUser.username,
    role: newUser.role
  });
}

/**
 * Log user update
 * @param {object} admin - Admin who updated
 * @param {object} updatedUser - Updated user data
 * @param {array} changedFields - Fields that were changed
 */
function logUserUpdated(admin, updatedUser, changedFields = []) {
  log(LogTypes.USER_UPDATED, admin, {
    userId: updatedUser.id,
    username: updatedUser.username,
    changedFields
  });
}

/**
 * Log user deletion
 * @param {object} admin - Admin who deleted
 * @param {object} deletedUser - Deleted user data
 */
function logUserDeleted(admin, deletedUser) {
  log(LogTypes.USER_DELETED, admin, {
    deletedUserId: deletedUser.id,
    deletedUsername: deletedUser.username
  });
}

/**
 * Log product creation
 * @param {object} user - User who created
 * @param {object} product - Product data
 */
function logProductCreated(user, product) {
  log(LogTypes.PRODUCT_CREATED, user, {
    productId: product.id,
    productName: product.name,
    barcode: product.barcode
  });
}

/**
 * Log product update
 * @param {object} user - User who updated
 * @param {object} product - Product data
 */
function logProductUpdated(user, product) {
  log(LogTypes.PRODUCT_UPDATED, user, {
    productId: product.id,
    productName: product.name
  });
}

/**
 * Log product deletion
 * @param {object} user - User who deleted
 * @param {object} product - Product data
 */
function logProductDeleted(user, product) {
  log(LogTypes.PRODUCT_DELETED, user, {
    productId: product.id,
    productName: product.name
  });
}

/**
 * Log sale completion
 * @param {object} user - User who made the sale
 * @param {object} saleData - Sale data
 */
function logSaleCompleted(user, saleData) {
  log(LogTypes.SALE_COMPLETED, user, {
    itemCount: saleData.itemCount,
    total: saleData.total,
    discount: saleData.discount || 0
  });
}

/**
 * Log cash register closing
 * @param {object} user - User who closed
 * @param {object} summary - Closing summary
 */
function logCashRegisterClosed(user, summary) {
  log(LogTypes.CASH_REGISTER_CLOSED, user, {
    totalRevenue: summary.totalRevenue,
    totalProfit: summary.totalProfit,
    totalItems: summary.totalItems
  });
}

/**
 * Log backup creation
 * @param {object} user - User who created
 * @param {string} filename - Backup filename
 * @param {string} type - 'auto' or 'manual'
 */
function logBackupCreated(user, filename, type = 'manual') {
  log(LogTypes.BACKUP_CREATED, user, { filename, type });
}

/**
 * Log backup restoration
 * @param {object} user - User who restored
 * @param {string} filename - Backup filename
 */
function logBackupRestored(user, filename) {
  log(LogTypes.BACKUP_RESTORED, user, { filename });
}

/**
 * Log backup deletion
 * @param {object} user - User who deleted
 * @param {string} filename - Backup filename
 */
function logBackupDeleted(user, filename) {
  log(LogTypes.BACKUP_DELETED, user, { filename });
}

/**
 * Log access denied
 * @param {object} user - User who was denied
 * @param {string} resource - Resource that was denied
 */
function logAccessDenied(user, resource) {
  log(LogTypes.ACCESS_DENIED, user, { resource });
}

/**
 * Read logs for a specific date
 * @param {string} date - Date string YYYY-MM-DD
 * @returns {array} Array of log entries
 */
function readLogs(date) {
  try {
    initLogDir();
    const logPath = path.join(logDir, `${date}.log`);

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);

    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(entry => entry !== null);
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

/**
 * Get list of available log files
 * @returns {array} Array of log file info
 */
function listLogFiles() {
  try {
    initLogDir();
    const files = fs.readdirSync(logDir)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const filePath = path.join(logDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          date: f.replace('.log', ''),
          size: stats.size,
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return files;
  } catch (error) {
    console.error('Error listing log files:', error);
    return [];
  }
}

/**
 * Get log directory path
 * @returns {string} Log directory path
 */
function getLogDir() {
  return initLogDir();
}

module.exports = {
  LogTypes,
  log,
  logLoginSuccess,
  logLoginFailed,
  logLogout,
  logSessionExpired,
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logProductCreated,
  logProductUpdated,
  logProductDeleted,
  logSaleCompleted,
  logCashRegisterClosed,
  logBackupCreated,
  logBackupRestored,
  logBackupDeleted,
  logAccessDenied,
  readLogs,
  listLogFiles,
  getLogDir
};
