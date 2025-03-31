
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  scanWifi: () => ipcRenderer.invoke('scan-wifi'),
  scanBluetooth: () => ipcRenderer.invoke('scan-bluetooth'),
});
