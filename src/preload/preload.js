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

  // Navigation
  navigate: (page) => ipcRenderer.invoke('navigate', page)
});
