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
  return await authService.login(username, password);
});

ipcMain.handle('auth:logout', () => {
  authService.logout();
  return { success: true };
});

ipcMain.handle('auth:getSession', () => {
  return authService.getSession();
});

ipcMain.handle('auth:isLoggedIn', () => {
  return authService.isLoggedIn();
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
  return await usersService.create(data);
});

ipcMain.handle('users:update', async (event, { id, data }) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  return await usersService.update(id, data);
});

ipcMain.handle('users:delete', (event, id) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  return usersService.remove(id);
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
  return productsService.create(data);
});

ipcMain.handle('products:update', (event, { id, data }) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.update(id, data);
});

ipcMain.handle('products:delete', (event, id) => {
  if (!authService.isManager()) {
    return { success: false, error: 'Acesso negado' };
  }
  return productsService.remove(id);
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
  if (!session || !session.userId) {
    return { success: false, error: 'Sessao invalida' };
  }
  return salesService.finalizeSale(items, session.userId, discountPercent);
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
  return reportsService.closeCashRegister();
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
  return backupService.createManualBackup();
});

ipcMain.handle('backup:restore', (event, filename) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  // Close database connection before restore
  closeDatabase();
  const result = backupService.restoreBackup(filename);
  // Reinitialize database after restore
  if (result.success) {
    initializeDatabase();
  }
  return result;
});

ipcMain.handle('backup:delete', (event, filename) => {
  if (!authService.isAdmin()) {
    return { success: false, error: 'Acesso negado' };
  }
  return backupService.deleteBackup(filename);
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
