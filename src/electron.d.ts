
interface ElectronAPI {
  scanWifi: () => Promise<import('./utils/deviceConnector').WiFiNetwork[]>;
  scanBluetooth: () => Promise<import('./utils/deviceConnector').BluetoothSignalReading[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
