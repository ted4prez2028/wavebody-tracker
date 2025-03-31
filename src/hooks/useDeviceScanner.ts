
import { useState, useEffect, useCallback } from 'react';
import { scanBluetoothDevices, getWiFiNetworks, browserSupport, BluetoothSignalReading, WiFiNetwork } from '../utils/deviceConnector';
import { useToast } from "@/hooks/use-toast";

export function useDeviceScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothSignalReading[]>([]);
  const [wifiNetworks, setWiFiNetworks] = useState<WiFiNetwork[]>([]);
  const [supportedFeatures, setSupportedFeatures] = useState(browserSupport);
  const { toast } = useToast();
  
  const startScan = useCallback(async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    toast({
      title: "Scanning Started",
      description: "Scanning for Bluetooth and WiFi signals...",
    });
    
    try {
      // Scan for Bluetooth devices
      if (supportedFeatures.bluetooth) {
        const devices = await scanBluetoothDevices();
        setBluetoothDevices(devices);
        toast({
          title: "Bluetooth Scan Complete",
          description: `Found ${devices.length} Bluetooth devices`,
        });
      } else {
        toast({
          title: "Bluetooth Not Supported",
          description: "Your browser doesn't support Bluetooth scanning.",
          variant: "destructive"
        });
      }
      
      // Try to get WiFi networks
      if (supportedFeatures.wifi) {
        const networks = await getWiFiNetworks();
        setWiFiNetworks(networks);
        toast({
          title: "WiFi Scan Complete",
          description: `Found ${networks.length} WiFi networks`,
        });
      } else {
        toast({
          title: "WiFi API Not Supported",
          description: "Your browser doesn't provide access to WiFi network information.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during scanning:", error);
      toast({
        title: "Scan Error",
        description: "An error occurred while scanning for devices.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, supportedFeatures, toast]);
  
  // Check for API support on mount
  useEffect(() => {
    setSupportedFeatures(browserSupport);
    
    if (!browserSupport.bluetooth && !browserSupport.wifi) {
      toast({
        title: "Limited Browser Support",
        description: "Your browser doesn't support the required APIs for real device scanning. Simulated data will be used instead.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  return {
    isScanning,
    bluetoothDevices,
    wifiNetworks,
    supportedFeatures,
    startScan
  };
}
