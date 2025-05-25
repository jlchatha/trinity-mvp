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
    clear: (key) => ipcRenderer.invoke('memory:clear', key),
    getStats: () => ipcRenderer.invoke('trinity:memory:getStats'),
    getAllMemories: () => ipcRenderer.invoke('trinity:memory:getAllMemories'),
    getMemoryDetails: (memoryId) => ipcRenderer.invoke('trinity:memory:getMemoryDetails', memoryId)
  },

  // Trinity memory hierarchy
  getMemoryStats: () => ipcRenderer.invoke('trinity:getMemoryStats'),
  loadMemoryArtifacts: () => ipcRenderer.invoke('trinity:loadMemoryArtifacts'),

  // Context optimization and auto-compact intelligence
  context: {
    getMetrics: () => ipcRenderer.invoke('trinity:context:getMetrics'),
    optimize: () => ipcRenderer.invoke('trinity:context:optimize'),
    resetSession: () => ipcRenderer.invoke('trinity:context:resetSession'),
    updateMetrics: (metrics) => ipcRenderer.invoke('trinity:context:updateMetrics', metrics)
  },

  // Auto-compact detector status
  autoCompact: {
    getStatus: () => ipcRenderer.invoke('trinity:autocompact:getStatus')
  },

  // Trinity Component APIs
  healthCheck: () => ipcRenderer.invoke('trinity:healthCheck'),
  getTaskStats: () => ipcRenderer.invoke('trinity:getTaskStats'),
  processFile: (filePath, category) => ipcRenderer.invoke('trinity:processFile', filePath, category),
  processFileContent: (fileName, content, category) => ipcRenderer.invoke('trinity:processFileContent', fileName, content, category),
  optimizeContext: () => ipcRenderer.invoke('trinity:optimizeContext'),
  createCheckpoint: () => ipcRenderer.invoke('trinity:createCheckpoint'),
  
  // Trinity Events
  subscribeToEvents: () => ipcRenderer.invoke('trinity:subscribeToEvents'),
  onMemoryEvent: (callback) => ipcRenderer.on('trinity:memory-event', callback),
  onTaskEvent: (callback) => ipcRenderer.on('trinity:task-event', callback),
  removeMemoryEventListener: (callback) => ipcRenderer.removeListener('trinity:memory-event', callback),
  removeTaskEventListener: (callback) => ipcRenderer.removeListener('trinity:task-event', callback)
});

// Remove the loading indicator once the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Trinity MVP Renderer Ready');
});