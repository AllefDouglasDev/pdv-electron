const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database');
const authService = require('./services/auth');
const usersService = require('./services/users');

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
