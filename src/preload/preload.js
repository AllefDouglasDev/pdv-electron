const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Authentication
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getSession: () => ipcRenderer.invoke('auth:getSession'),
    isLoggedIn: () => ipcRenderer.invoke('auth:isLoggedIn')
  },

  // User Management
  users: {
    list: (search) => ipcRenderer.invoke('users:list', search),
    getById: (id) => ipcRenderer.invoke('users:getById', id),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('users:delete', id)
  },

  // Product Management
  products: {
    list: (options) => ipcRenderer.invoke('products:list', options),
    getById: (id) => ipcRenderer.invoke('products:getById', id),
    getByBarcode: (barcode) => ipcRenderer.invoke('products:getByBarcode', barcode),
    create: (data) => ipcRenderer.invoke('products:create', data),
    update: (id, data) => ipcRenderer.invoke('products:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    count: (search) => ipcRenderer.invoke('products:count', search),
    getLowStock: (threshold) => ipcRenderer.invoke('products:getLowStock', threshold)
  },

  // Sales / PDV
  sales: {
    getProductByBarcode: (barcode) => ipcRenderer.invoke('sales:getProductByBarcode', barcode),
    checkStock: (productId, quantity) => ipcRenderer.invoke('sales:checkStock', { productId, quantity }),
    finalize: (items, discountPercent) => ipcRenderer.invoke('sales:finalize', { items, discountPercent }),
    getTodaySales: (userId) => ipcRenderer.invoke('sales:getTodaySales', userId),
    getTodaySummary: () => ipcRenderer.invoke('sales:getTodaySummary')
  },

  // Reports
  reports: {
    getAllSales: () => ipcRenderer.invoke('reports:getAllSales'),
    getSummary: () => ipcRenderer.invoke('reports:getSummary'),
    closeCashRegister: () => ipcRenderer.invoke('reports:closeCashRegister'),
    getSalesCount: () => ipcRenderer.invoke('reports:getSalesCount')
  },

  // Backup
  backup: {
    list: () => ipcRenderer.invoke('backup:list'),
    createManual: () => ipcRenderer.invoke('backup:createManual'),
    restore: (filename) => ipcRenderer.invoke('backup:restore', filename),
    delete: (filename) => ipcRenderer.invoke('backup:delete', filename),
    getStats: () => ipcRenderer.invoke('backup:getStats'),
    verifyIntegrity: (filename) => ipcRenderer.invoke('backup:verifyIntegrity', filename)
  },

  // Printer
  printer: {
    getPrinters: () => ipcRenderer.invoke('printer:getPrinters'),
    getDefaultPrinter: () => ipcRenderer.invoke('printer:getDefaultPrinter'),
    print: (saleData, receiptConfig, printOptions) => ipcRenderer.invoke('printer:print', { saleData, receiptConfig, printOptions }),
    preview: (saleData, receiptConfig) => ipcRenderer.invoke('printer:preview', { saleData, receiptConfig }),
    test: (printerName) => ipcRenderer.invoke('printer:test', printerName),
    getConfig: () => ipcRenderer.invoke('printer:getConfig')
  },

  // Navigation
  navigate: (page) => ipcRenderer.invoke('navigate', page)
});
