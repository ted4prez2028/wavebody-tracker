
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Wifi, Bluetooth, Map, Navigation, Radar, AlertCircle } from "lucide-react";
import { useDeviceScanner } from "../hooks/useDeviceScanner";
import { useToast } from "@/hooks/use-toast";

const Sidebar = () => {
  const { isScanning, bluetoothDevices, wifiNetworks, supportedFeatures, startScan } = useDeviceScanner();
  const { toast } = useToast();

  const handleScanClick = () => {
    if (!supportedFeatures.bluetooth && !supportedFeatures.wifi) {
      toast({
        title: "Device APIs Not Supported",
        description: "Your browser doesn't support the required APIs. Using simulation mode instead.",
        variant: "destructive"
      });
    }
    startScan();
  };
  
  return (
    <div className="w-64 border-r border-border bg-card p-4 flex flex-col overflow-auto shrink-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-wavebody-cyan glow-text mb-1">WaveBody</h1>
        <p className="text-muted-foreground text-sm">Tracking human movement through wave disturbances</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-wavebody-purple">Signal Sources</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi size={18} className="text-wavebody-blue" />
              <span className="text-sm">WiFi</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              {!supportedFeatures.wifi && <AlertCircle size={16} className="text-amber-500" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth size={18} className="text-wavebody-blue" />
              <span className="text-sm">Bluetooth</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              {!supportedFeatures.bluetooth && <AlertCircle size={16} className="text-amber-500" />}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-wavebody-purple">Sensitivity</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Detection Range</span>
              <span className="text-xs text-muted-foreground">8m</span>
            </div>
            <Slider defaultValue={[80]} max={100} step={10} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Precision</span>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <Slider defaultValue={[70]} max={100} step={10} />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-wavebody-purple">Visualization</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar size={18} className="text-wavebody-cyan" />
              <span className="text-sm">Real-time</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map size={18} className="text-wavebody-cyan" />
              <span className="text-sm">Show Map</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={18} className="text-wavebody-cyan" />
              <span className="text-sm">Movement Trails</span>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        
        {(bluetoothDevices.length > 0 || wifiNetworks.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-wavebody-purple">Detected Signals</h3>
            <div className="text-xs text-muted-foreground">
              <p className="mb-1">Bluetooth: {bluetoothDevices.length} devices</p>
              <p>WiFi: {wifiNetworks.length} networks</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Button 
          className="w-full bg-wavebody-blue hover:bg-wavebody-purple transition-colors"
          onClick={handleScanClick}
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Scan Area"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
