const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database');
const authService = require('./services/auth');
const usersService = require('./services/users');
const productsService = require('./services/products');
const salesService = require('./services/sales');
const reportsService = require('./services/reports');
const backupService = require('./services/backup');
const receiptService = require('./services/receipt');
const printerService = require('./services/printer');
const logger = require('./services/logger');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/pages/login.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Create automatic backup before initializing database
    const backupResult = backupService.createAutomaticBackup();
    if (backupResult.success) {
      if (backupResult.restored) {
        console.log('Banco restaurado do backup:', backupResult.backupUsed);
      } else if (backupResult.filename) {
        console.log('Backup automático criado:', backupResult.filename);
      }
    } else if (backupResult.error) {
      console.error('Erro no backup automático:', backupResult.error);
    }

    const dbResult = await initializeDatabase();
    console.log('Banco de dados inicializado:', dbResult.path);
    if (dbResult.adminCreated) {
      console.log('Usuário admin criado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for Authentication
ipcMain.handle('auth:login', async (event, { username, password }) => {
  const result = await authService.login(username, password);
  if (result.success) {
    logger.logLoginSuccess(result.user);
  } else {
    logger.logLoginFailed(username, result.error);
  }
  return result;
});

ipcMain.handle('auth:logout', () => {
  const session = authService.getSession();
  if (session) {
    logger.logLogout(session);
  }
  authService.logout();
  return { success: true };
});

ipcMain.handle('auth:getSession', () => {
  const wasLoggedIn = authService.isLoggedIn();
  const session = authService.getSession();

  // Check if session expired
  if (wasLoggedIn && !session) {
    logger.logSessionExpired({ id: null, username: 'unknown' });
  }

  return session;
});

ipcMain.handle('auth:isLoggedIn', () => {
  return authService.isLoggedIn();
});

ipcMain.handle('auth:updateActivity', () => {
  authService.updateActivity();
  return { success: true };
});

ipcMain.handle('auth:getSessionTimeout', () => {
  return authService.getSessionTimeout();
});

// Navigation handler
ipcMain.handle('navigate', (event, page) => {
  const pagePath = path.join(__dirname, '../renderer/pages', `${page}.html`);
  mainWindow.loadFile(pagePath);
  return { success: true };
});

// IPC Handlers for User Management
ipcMain.handle('users:list', (event, search) => {
  // Check if user is admin
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  return usersService.list(search);
});

ipcMain.handle('users:getById', (event, id) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  return usersService.getById(id);
});

ipcMain.handle('users:create', async (event, data) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = await usersService.create(data);
  if (result.success) {
    const session = authService.getSession();
    logger.logUserCreated(session, { id: result.id, username: data.username, role: data.role });
  }
  return result;
});

ipcMain.handle('users:update', async (event, { id, data }) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const existingUser = usersService.getById(id);
  const result = await usersService.update(id, data);
  if (result.success && existingUser.success) {
    const session = authService.getSession();
    const changedFields = [];
    if (existingUser.user.fullName !== data.fullName) changedFields.push('fullName');
    if (existingUser.user.role !== data.role) changedFields.push('role');
    if (existingUser.user.isActive !== data.isActive) changedFields.push('isActive');
    if (data.password) changedFields.push('password');
    logger.logUserUpdated(session, { id, username: existingUser.user.username }, changedFields);
  }
  return result;
});

ipcMain.handle('users:delete', (event, id) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const existingUser = usersService.getById(id);
  const result = usersService.remove(id);
  if (result.success && existingUser.success) {
    const session = authService.getSession();
    logger.logUserDeleted(session, { id, username: existingUser.user.username });
  }
  return result;
});

// IPC Handlers for Product Management
ipcMain.handle('products:list', (event, options) => {
  // Allow all logged users to list products (for stock viewing)
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.list(options);
});

ipcMain.handle('products:getById', (event, id) => {
  // Allow all logged users to get product details (for stock viewing)
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.getById(id);
});

ipcMain.handle('products:getByBarcode', (event, barcode) => {
  // Allow all logged users to search by barcode (for PDV)
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.getByBarcode(barcode);
});

ipcMain.handle('products:create', (event, data) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = productsService.create(data);
  if (result.success) {
    const session = authService.getSession();
    logger.logProductCreated(session, { id: result.id, name: data.name, barcode: data.barcode });
  }
  return result;
});

ipcMain.handle('products:update', (event, { id, data }) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = productsService.update(id, data);
  if (result.success) {
    const session = authService.getSession();
    logger.logProductUpdated(session, { id, name: data.name });
  }
  return result;
});

ipcMain.handle('products:delete', (event, id) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  const existingProduct = productsService.getById(id);
  const result = productsService.remove(id);
  if (result.success && existingProduct.success) {
    const session = authService.getSession();
    logger.logProductDeleted(session, { id, name: existingProduct.product.name });
  }
  return result;
});

ipcMain.handle('products:count', (event, search) => {
  // Allow all logged users to count products (for stock viewing)
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.count(search);
});

ipcMain.handle('products:getLowStock', (event, threshold) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.getLowStock(threshold);
});

// IPC Handlers for Sales / PDV
ipcMain.handle('sales:getProductByBarcode', (event, barcode) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return salesService.getProductByBarcode(barcode);
});

ipcMain.handle('sales:checkStock', (event, { productId, quantity }) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return salesService.checkStock(productId, quantity);
});

ipcMain.handle('sales:finalize', (event, { items, discountPercent }) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  const session = authService.getSession();
  if (!session || !session.id) {
    return { success: false, error: 'Sessao invalida' };
  }
  const result = salesService.finalizeSale(items, session.id, discountPercent);
  if (result.success) {
    const total = items.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    logger.logSaleCompleted(session, {
      itemCount: items.length,
      total: total * (1 - (discountPercent || 0) / 100),
      discount: discountPercent || 0
    });
  }
  return result;
});

ipcMain.handle('sales:getTodaySales', (event, userId) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return salesService.getTodaySales(userId);
});

ipcMain.handle('sales:getTodaySummary', () => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return salesService.getTodaySummary();
});

// IPC Handlers for Reports
ipcMain.handle('reports:getAllSales', () => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return reportsService.getAllSales();
});

ipcMain.handle('reports:getSummary', () => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return reportsService.getSalesSummary();
});

ipcMain.handle('reports:closeCashRegister', () => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = reportsService.closeCashRegister();
  if (result.success) {
    const session = authService.getSession();
    logger.logCashRegisterClosed(session, result.closedSummary);
  }
  return result;
});

ipcMain.handle('reports:getSalesCount', () => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return reportsService.getSalesCount();
});

// IPC Handlers for Backup
ipcMain.handle('backup:list', () => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    const backups = backupService.listBackups();
    return { success: true, backups };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:createManual', () => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = backupService.createManualBackup();
  if (result.success) {
    const session = authService.getSession();
    logger.logBackupCreated(session, result.filename, 'manual');
  }
  return result;
});

ipcMain.handle('backup:restore', (event, filename) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const session = authService.getSession();
  // Close database connection before restore
  closeDatabase();
  const result = backupService.restoreBackup(filename);
  // Reinitialize database after restore
  if (result.success) {
    initializeDatabase();
    logger.logBackupRestored(session, filename);
  }
  return result;
});

ipcMain.handle('backup:delete', (event, filename) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const result = backupService.deleteBackup(filename);
  if (result.success) {
    const session = authService.getSession();
    logger.logBackupDeleted(session, filename);
  }
  return result;
});

ipcMain.handle('backup:getStats', () => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    const stats = backupService.getBackupStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:verifyIntegrity', (event, filename) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  const backupDir = backupService.getBackupDir();
  const path = require('path');
  const filePath = path.join(backupDir, filename);
  return backupService.verifyIntegrity(filePath);
});

// IPC Handlers for Printing
ipcMain.handle('printer:getPrinters', async () => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    const printers = await printerService.getPrinters(mainWindow);
    return { success: true, printers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:getDefaultPrinter', async () => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    const printer = await printerService.getDefaultPrinter(mainWindow);
    return { success: true, printer };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:print', async (event, { saleData, receiptConfig, printOptions }) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    // Add operator name from session
    const session = authService.getSession();
    const saleDataWithOperator = {
      ...saleData,
      operatorName: saleData.operatorName || session?.fullName || session?.username || 'Operador'
    };
    return await printerService.printSaleReceipt(saleDataWithOperator, receiptConfig, printOptions);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:preview', (event, { saleData, receiptConfig }) => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    // Add operator name from session
    const session = authService.getSession();
    const saleDataWithOperator = {
      ...saleData,
      operatorName: saleData.operatorName || session?.fullName || session?.username || 'Operador'
    };
    const preview = receiptService.generateReceiptPreview(saleDataWithOperator, receiptConfig);
    return { success: true, preview };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:test', async (event, printerName) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  try {
    return await printerService.testPrinter(printerName);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:getConfig', () => {
  if (!authService.isLoggedIn()) {
    return { success: false, error: 'Acesso negado' };
  }
  return { success: true, config: receiptService.getDefaultConfig() };
});
