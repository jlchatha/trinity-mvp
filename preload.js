const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('trinityAPI', {
  // Application control
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  
  // Trinity MVP specific APIs (to be implemented)
  overseer: {
    sendMessage: (message) => ipcRenderer.invoke('overseer:sendMessage', message),
    getStatus: () => ipcRenderer.invoke('overseer:getStatus'),
    onStatusUpdate: (callback) => ipcRenderer.on('overseer:statusUpdate', callback)
  },
  
  worker: {
    executeTask: (task) => ipcRenderer.invoke('worker:executeTask', task),
    getCapabilities: () => ipcRenderer.invoke('worker:getCapabilities'),
    getTaskStatus: (taskId) => ipcRenderer.invoke('worker:getTaskStatus', taskId),
    onTaskUpdate: (callback) => ipcRenderer.on('worker:taskUpdate', callback),
    removeTaskUpdateListener: (callback) => ipcRenderer.removeListener('worker:taskUpdate', callback)
  },
  
  system: {
    getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
    checkConnectivity: () => ipcRenderer.invoke('system:checkConnectivity'),
    onSystemEvent: (callback) => ipcRenderer.on('system:event', callback)
  },
  
  // Memory and persistence
  memory: {
    save: (key, data) => ipcRenderer.invoke('memory:save', key, data),
    load: (key) => ipcRenderer.invoke('memory:load', key),
    clear: (key) => ipcRenderer.invoke('memory:clear', key)
  }
});

// Remove the loading indicator once the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Trinity MVP Renderer Ready');
});