
import React from 'react';
import Layout from '../components/Layout';
import WaveVisualizer from '../components/WaveVisualizer';

const Index = () => {
  return (
    <Layout>
      <div className="absolute top-4 right-4 z-10 max-w-md bg-black/60 p-3 rounded-lg text-xs text-gray-300 backdrop-blur-sm">
        <h3 className="text-wavebody-cyan text-sm font-medium mb-1">Wave Physics Simulation</h3>
        <p className="mb-2">Visualizing how electromagnetic waves from WiFi (2.4GHz/5GHz) and Bluetooth sources propagate through space and interact with human bodies.</p>
        <p>Signal attenuation is calculated using inverse-square law with frequency-dependent properties. Human detection uses multilateration based on signal delays.</p>
      </div>
      <WaveVisualizer />
    </Layout>
  );
};

export default Index;

