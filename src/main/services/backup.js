const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

/**
 * Get the backup directory path
 * @returns {string} Path to the backup directory
 */
function getBackupDir() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'backups');
  }
  return path.join(__dirname, '../../../backups');
}

/**
 * Get the database file path
 * @returns {string} Path to the database file
 */
function getDatabasePath() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'mercado.db');
  }
  return path.join(__dirname, '../../../mercado.db');
}

/**
 * Format timestamp for backup filename
 * @param {Date} date - Date object
 * @returns {string} Formatted timestamp (YYYY-MM-DD_HH-mm-ss)
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Parse backup filename to extract information
 * @param {string} filename - Backup filename
 * @returns {object} Parsed backup info
 */
function parseBackupFilename(filename) {
  const isManual = filename.includes('MANUAL');
  const isInitial = filename.includes('INICIAL');
  const isPreRestore = filename.includes('PRE_RESTORE');

  // Extract timestamp from filename
  let timestamp = null;
  const timestampMatch = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
  if (timestampMatch) {
    const [datePart, timePart] = timestampMatch[1].split('_');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes, seconds] = timePart.split('-');
    timestamp = new Date(year, month - 1, day, hours, minutes, seconds);
  }

  return {
    filename,
    isManual,
    isInitial,
    isPreRestore,
    timestamp,
    type: isInitial ? 'initial' : isManual ? 'manual' : isPreRestore ? 'pre_restore' : 'automatic'
  };
}

/**
 * Ensure backup directory exists
 * @returns {boolean} True if directory exists or was created
 */
function ensureBackupDir() {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    return true;
  }
  return true;
}

/**
 * Check if database file exists
 * @returns {boolean} True if database exists
 */
function databaseExists() {
  const dbPath = getDatabasePath();
  return fs.existsSync(dbPath);
}

/**
 * Verify database integrity
 * @param {string} dbPath - Path to database file
 * @returns {object} Integrity check result
 */
function verifyIntegrity(dbPath) {
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'Arquivo não encontrado' };
    }

    const db = new Database(dbPath, { readonly: true });

    // Check SQLite integrity
    const integrityResult = db.pragma('integrity_check');
    if (integrityResult[0].integrity_check !== 'ok') {
      db.close();
      return { success: false, error: 'Banco de dados corrompido' };
    }

    // Check if required tables exist
    const requiredTables = ['users', 'products', 'sales'];
    const existingTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all().map(row => row.name);

    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        db.close();
        return { success: false, error: `Tabela '${table}' não encontrada` };
      }
    }

    db.close();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Copy file (used for backup operations)
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @returns {boolean} True if copy was successful
 */
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error('Erro ao copiar arquivo:', error);
    return false;
  }
}

/**
 * Get list of backup files
 * @returns {array} List of backup file information
 */
function listBackups() {
  const backupDir = getBackupDir();

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('mercado_') && f.endsWith('.db'));

  return files.map(filename => {
    const filePath = path.join(backupDir, filename);
    const stats = fs.statSync(filePath);
    const parsed = parseBackupFilename(filename);

    return {
      ...parsed,
      path: filePath,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      createdAt: stats.mtime
    };
  }).sort((a, b) => b.createdAt - a.createdAt); // Most recent first
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Create automatic backup on system startup
 * @returns {object} Result of backup operation
 */
function createAutomaticBackup() {
  try {
    ensureBackupDir();

    const dbPath = getDatabasePath();
    const backupDir = getBackupDir();

    // Check if database exists
    if (!databaseExists()) {
      // First time - no backup needed, database will be created
      return { success: true, message: 'Primeiro uso - banco será criado' };
    }

    // Verify database integrity
    const integrityCheck = verifyIntegrity(dbPath);
    if (!integrityCheck.success) {
      // Database corrupted - try to restore from backup
      const restoreResult = restoreLatestBackup();
      if (restoreResult.success) {
        return {
          success: true,
          restored: true,
          message: `Banco recuperado do backup: ${restoreResult.backupUsed}`,
          backupUsed: restoreResult.backupUsed
        };
      }
      return {
        success: false,
        corrupted: true,
        error: 'Banco corrompido e não foi possível restaurar'
      };
    }

    // Check if initial backup exists
    const initialBackupPath = path.join(backupDir, 'mercado_INICIAL.db');
    if (!fs.existsSync(initialBackupPath)) {
      copyFile(dbPath, initialBackupPath);
    }

    // Create timestamped backup
    const timestamp = formatTimestamp(new Date());
    const backupFilename = `mercado_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);

    if (!copyFile(dbPath, backupPath)) {
      return { success: false, error: 'Falha ao criar backup' };
    }

    // Manage retention (keep only last 30 automatic backups)
    manageRetention(30);

    return {
      success: true,
      filename: backupFilename,
      path: backupPath
    };
  } catch (error) {
    console.error('Erro no backup automático:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create manual backup (admin only)
 * @returns {object} Result of backup operation
 */
function createManualBackup() {
  try {
    ensureBackupDir();

    const dbPath = getDatabasePath();
    const backupDir = getBackupDir();

    if (!databaseExists()) {
      return { success: false, error: 'Banco de dados não existe' };
    }

    // Verify integrity before backup
    const integrityCheck = verifyIntegrity(dbPath);
    if (!integrityCheck.success) {
      return { success: false, error: 'Banco de dados com problemas: ' + integrityCheck.error };
    }

    const timestamp = formatTimestamp(new Date());
    const backupFilename = `mercado_MANUAL_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);

    if (!copyFile(dbPath, backupPath)) {
      return { success: false, error: 'Falha ao criar backup' };
    }

    return {
      success: true,
      filename: backupFilename,
      path: backupPath
    };
  } catch (error) {
    console.error('Erro no backup manual:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manage backup retention (keep only specified number of automatic backups)
 * @param {number} limit - Maximum number of automatic backups to keep
 */
function manageRetention(limit = 30) {
  const backupDir = getBackupDir();

  if (!fs.existsSync(backupDir)) {
    return;
  }

  // List only automatic backups (exclude MANUAL, INICIAL, PRE_RESTORE)
  const automaticBackups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('mercado_') &&
                 f.endsWith('.db') &&
                 !f.includes('MANUAL') &&
                 !f.includes('INICIAL') &&
                 !f.includes('PRE_RESTORE'))
    .sort(); // Oldest first (by filename/date)

  // Remove excess backups
  while (automaticBackups.length > limit) {
    const oldest = automaticBackups.shift();
    const oldestPath = path.join(backupDir, oldest);
    try {
      fs.unlinkSync(oldestPath);
      console.log('Backup antigo removido:', oldest);
    } catch (error) {
      console.error('Erro ao remover backup antigo:', error);
    }
  }
}

/**
 * Find the most recent valid backup
 * @returns {object|null} Most recent valid backup or null
 */
function findLatestValidBackup() {
  const backups = listBackups();

  for (const backup of backups) {
    // Skip the main database path (we want backups only)
    if (backup.isInitial) continue; // Try initial backup last

    const integrityCheck = verifyIntegrity(backup.path);
    if (integrityCheck.success) {
      return backup;
    }
  }

  // Try initial backup as last resort
  const initialBackup = backups.find(b => b.isInitial);
  if (initialBackup) {
    const integrityCheck = verifyIntegrity(initialBackup.path);
    if (integrityCheck.success) {
      return initialBackup;
    }
  }

  return null;
}

/**
 * Restore the latest valid backup automatically
 * @returns {object} Result of restore operation
 */
function restoreLatestBackup() {
  const latestBackup = findLatestValidBackup();

  if (!latestBackup) {
    return { success: false, error: 'Nenhum backup válido encontrado' };
  }

  return restoreBackup(latestBackup.filename);
}

/**
 * Restore a specific backup
 * @param {string} backupFilename - Name of backup file to restore
 * @returns {object} Result of restore operation
 */
function restoreBackup(backupFilename) {
  try {
    const backupDir = getBackupDir();
    const dbPath = getDatabasePath();
    const backupPath = path.join(backupDir, backupFilename);

    // Verify backup exists
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Arquivo de backup não encontrado' };
    }

    // Verify backup integrity
    const integrityCheck = verifyIntegrity(backupPath);
    if (!integrityCheck.success) {
      return { success: false, error: 'Backup corrompido: ' + integrityCheck.error };
    }

    // Create safety backup of current state (if database exists)
    if (fs.existsSync(dbPath)) {
      const timestamp = formatTimestamp(new Date());
      const safetyBackupFilename = `mercado_PRE_RESTORE_${timestamp}.db`;
      const safetyBackupPath = path.join(backupDir, safetyBackupFilename);
      copyFile(dbPath, safetyBackupPath);
    }

    // Restore the backup
    if (!copyFile(backupPath, dbPath)) {
      return { success: false, error: 'Falha ao restaurar backup' };
    }

    return {
      success: true,
      backupUsed: backupFilename,
      message: 'Backup restaurado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a backup file
 * @param {string} backupFilename - Name of backup file to delete
 * @returns {object} Result of delete operation
 */
function deleteBackup(backupFilename) {
  try {
    // Prevent deletion of initial backup
    if (backupFilename.includes('INICIAL')) {
      return { success: false, error: 'Não é possível excluir o backup inicial' };
    }

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, backupFilename);

    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Arquivo de backup não encontrado' };
    }

    fs.unlinkSync(backupPath);

    return { success: true, message: 'Backup excluído com sucesso' };
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get backup statistics
 * @returns {object} Backup statistics
 */
function getBackupStats() {
  const backups = listBackups();
  const backupDir = getBackupDir();

  let totalSize = 0;
  let automaticCount = 0;
  let manualCount = 0;

  for (const backup of backups) {
    totalSize += backup.size;
    if (backup.isManual) {
      manualCount++;
    } else if (!backup.isInitial && !backup.isPreRestore) {
      automaticCount++;
    }
  }

  return {
    totalBackups: backups.length,
    automaticBackups: automaticCount,
    manualBackups: manualCount,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    backupDir,
    latestBackup: backups[0] || null
  };
}

module.exports = {
  getBackupDir,
  getDatabasePath,
  ensureBackupDir,
  databaseExists,
  verifyIntegrity,
  listBackups,
  createAutomaticBackup,
  createManualBackup,
  manageRetention,
  findLatestValidBackup,
  restoreLatestBackup,
  restoreBackup,
  deleteBackup,
  getBackupStats
};
