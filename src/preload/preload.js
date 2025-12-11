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

  // Navigation
  navigate: (page) => ipcRenderer.invoke('navigate', page)
});
