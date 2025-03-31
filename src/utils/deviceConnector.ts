// API support flags
export const browserSupport = {
  bluetooth: 'bluetooth' in navigator || typeof window.electronAPI !== 'undefined',
  wifi: ('connection' in navigator && 'type' in (navigator as any).connection) || typeof window.electronAPI !== 'undefined'
};

// Bluetooth device connection and scanning
export interface BluetoothSignalReading {
  deviceId: string;
  name: string | null;
  rssi: number; // Signal strength
  manufacturerData?: Map<number, DataView>;
  serviceData?: Map<string, DataView>;
  timestamp?: number;
}

export interface WiFiNetwork {
  bssid?: string; // MAC address (may not be available in all browsers)
  ssid?: string;
  frequency?: number;
  signalStrength: number; // RSSI value
  timestamp: number;
}

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
};

// Get Bluetooth devices and their signal strengths
export async function scanBluetoothDevices(): Promise<BluetoothSignalReading[]> {
  // If we're in Electron, use the Electron API
  if (isElectron()) {
    try {
      const devices = await window.electronAPI.scanBluetooth();
      return devices;
    } catch (error) {
      console.error("Error scanning Bluetooth devices via Electron:", error);
      return [];
    }
  }
  
  // Otherwise use the browser API if available
  if (!browserSupport.bluetooth || !('bluetooth' in navigator)) {
    console.warn("Bluetooth API not supported in this browser");
    return [];
  }
  
  try {
    // Request permission and start scanning
    const devices = await (navigator as any).bluetooth.requestLEScan({
      acceptAllAdvertisements: true,
      keepRepeatedDevices: true
    });
    
    // Create an array to store scan results
    const readings: BluetoothSignalReading[] = [];
    
    // Listen for advertising events
    (navigator as any).bluetooth.addEventListener('advertisementreceived', (event: any) => {
      readings.push({
        deviceId: event.device.id,
        name: event.device.name,
        rssi: event.rssi,
        manufacturerData: event.manufacturerData,
        serviceData: event.serviceData,
        timestamp: Date.now()
      });
    });
    
    // Wait for some results
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Stop scanning
    devices.stop();
    
    return readings;
  } catch (error) {
    console.error("Error scanning Bluetooth devices:", error);
    return [];
  }
}

// Get WiFi networks information
export async function getWiFiNetworks(): Promise<WiFiNetwork[]> {
  // If we're in Electron, use the Electron API
  if (isElectron()) {
    try {
      const networks = await window.electronAPI.scanWifi();
      return networks;
    } catch (error) {
      console.error("Error getting WiFi networks via Electron:", error);
      return [];
    }
  }
  
  // Otherwise use the browser API if available
  if (!(navigator as any).getNetworkInformation) {
    console.warn("WiFi API not supported in this browser");
    return [];
  }
  
  try {
    const networks = await (navigator as any).getNetworkInformation();
    return networks.map((network: any) => ({
      bssid: network.bssid,
      ssid: network.ssid,
      frequency: network.frequency || network.channel,
      signalStrength: network.signal_level || network.quality,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Error getting WiFi networks:", error);
    return [];
  }
}

// Get current connection information
export function getCurrentConnectionInfo() {
  if (!browserSupport.wifi) {
    return null;
  }
  
  const connection = (navigator as any).connection;
  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlinkMax: connection.downlinkMax,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  };
}

// Calculate approximate distance based on RSSI
export function calculateDistanceFromRSSI(rssi: number, txPower: number = -59): number {
  if (rssi === 0) {
    return -1; // Cannot determine distance
  }
  
  // FSPL (Free Space Path Loss) calculation
  // n is the path loss exponent (typically 2-4)
  const n = 2.4;
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

// Use triangulation to estimate position based on multiple signal strengths
export function estimatePositionFromSignals(
  signalReadings: Array<{position: [number, number, number], distance: number}>
): [number, number, number] | null {
  // Need at least 3 readings for triangulation
  if (signalReadings.length < 3) {
    return null;
  }
  
  // This is a simplified multilateration algorithm
  // In a real-world application, you'd use a more sophisticated approach
  
  // Sum up the weighted positions based on inverse distance
  let totalWeight = 0;
  const weightedSum: [number, number, number] = [0, 0, 0];
  
  signalReadings.forEach(reading => {
    const weight = 1 / (reading.distance * reading.distance);
    weightedSum[0] += reading.position[0] * weight;
    weightedSum[1] += reading.position[1] * weight;
    weightedSum[2] += reading.position[2] * weight;
    totalWeight += weight;
  });
  
  // Calculate the weighted average
  return [
    weightedSum[0] / totalWeight,
    weightedSum[1] / totalWeight,
    weightedSum[2] / totalWeight
  ];
}
