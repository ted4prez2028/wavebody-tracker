
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
// Note: These may need to be installed with npm install
import wifi from 'node-wifi';
import bluetooth from 'node-bluetooth';

// Get the directory name properly in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize the WiFi module
wifi.init({
  iface: null // Use the default network interface
});

// Create the browser window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:8080' // Dev server from Vite
      : `file://${path.join(__dirname, '../dist/index.html')}` // Production build
  );

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC messages from the renderer process
// Scan for WiFi networks
ipcMain.handle('scan-wifi', async () => {
  try {
    const networks = await wifi.scan();
    return networks.map(network => ({
      ssid: network.ssid,
      bssid: network.bssid || network.mac,
      frequency: network.frequency || network.channel,
      signalStrength: network.signal_level || network.quality,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error scanning WiFi:', error);
    return [];
  }
});

// Scan for Bluetooth devices
ipcMain.handle('scan-bluetooth', async () => {
  return new Promise((resolve, reject) => {
    const bt = new bluetooth.DeviceINQ();
    const devices = [];
    
    bt.on('finished', () => {
      resolve(devices);
    });
    
    bt.on('found', (address, name) => {
      devices.push({
        deviceId: address,
        name: name,
        rssi: Math.floor(Math.random() * -40) - 30, // Mock RSSI for now
        timestamp: Date.now()
      });
    });
    
    bt.inquire();
  });
});
