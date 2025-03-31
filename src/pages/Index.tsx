
import React from 'react';
import Layout from '../components/Layout';
import WaveVisualizer from '../components/WaveVisualizer';

const Index = () => {
  return (
    <Layout>
      <div className="absolute top-4 right-4 z-10 max-w-md bg-black/60 p-3 rounded-lg text-xs text-gray-300 backdrop-blur-sm">
        <h3 className="text-wavebody-cyan text-sm font-medium mb-1">Wave Physics Simulation</h3>
        <p className="mb-2">Visualizing how electromagnetic waves from WiFi (2.4GHz/5GHz) and Bluetooth sources propagate through space and interact with human bodies.</p>
        <p className="mb-2">When available, real Bluetooth device data is used to enhance the simulation. Press "Scan Area" to attempt connection to real devices.</p>
        <p className="text-amber-400 text-[10px] mb-0">Note: Most browsers limit access to WiFi and Bluetooth APIs for security and privacy reasons. Chrome on Android with proper permissions offers the best experience for real device scanning.</p>
      </div>
      <WaveVisualizer />
    </Layout>
  );
};

export default Index;
