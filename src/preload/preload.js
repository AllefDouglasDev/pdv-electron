const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Database operations will be added here
  // Example: invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
