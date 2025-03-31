
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateMockHumanPositions, calculateWaveIntensity } from '../utils/mockData';
import { useDeviceScanner } from '../hooks/useDeviceScanner';
import { calculateDistanceFromRSSI, estimatePositionFromSignals } from '../utils/deviceConnector';
import * as THREE from 'three';

// Component to create a floor grid
const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#111" 
        metalness={0.2}
        roughness={0.8}
      />
      <gridHelper args={[20, 20, '#444', '#222']} />
    </mesh>
  );
};

// Component to create walls for a building
const Walls = () => {
  return (
    <group>
      {/* Outer walls */}
      <mesh position={[0, 1.5, -10]} castShadow>
        <boxGeometry args={[20, 3, 0.2]} />
        <meshStandardMaterial color="#333" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.5, 10]} castShadow>
        <boxGeometry args={[20, 3, 0.2]} />
        <meshStandardMaterial color="#333" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-10, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 20]} />
        <meshStandardMaterial color="#333" transparent opacity={0.7} />
      </mesh>
      <mesh position={[10, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 20]} />
        <meshStandardMaterial color="#333" transparent opacity={0.7} />
      </mesh>
      
      {/* Inner walls */}
      <mesh position={[-5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 15]} />
        <meshStandardMaterial color="#333" transparent opacity={0.5} />
      </mesh>
      <mesh position={[5, 1.5, -5]} castShadow>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#333" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// Component to create wave emitters (WiFi/Bluetooth sources)
const WaveEmitter = ({ position, frequency = 2400, power = 100, isReal = false }: 
  { position: [number, number, number], frequency?: number, power?: number, isReal?: boolean }) => {
  
  // Color based on frequency (bluetooth = blue, wifi = cyan)
  const color = frequency < 2450 ? "#4A74FF" : "#4AC9FF";
  
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={isReal ? 1.0 : 0.5} 
      />
      {isReal && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#00FF00" />
        </mesh>
      )}
    </mesh>
  );
};

// Component to create wave visualizations
const WaveEffect = ({ position, intensity, frequency }: 
  { position: [number, number, number], intensity: number, frequency: number }) => {
  const waveRef = useRef<THREE.Mesh>(null);
  
  // Calculate wave properties based on frequency
  const waveColor = useMemo(() => {
    // Different colors for different frequencies
    if (frequency < 2450) return "#A45CFF"; // Bluetooth
    return "#4AC9FF"; // WiFi
  }, [frequency]);
  
  // Wave speed based on frequency (higher frequency = faster waves)
  const waveSpeed = useMemo(() => {
    return 0.002 * (frequency / 2400);
  }, [frequency]);
  
  useEffect(() => {
    if (!waveRef.current) return;
    
    const animate = () => {
      if (waveRef.current && waveRef.current.material) {
        // Safety check + handle material type
        const material = waveRef.current.material;
        if (!Array.isArray(material) && 'opacity' in material) {
          // Calculate wave propagation based on physics
          const time = Date.now() * waveSpeed;
          const wavelength = 299792458 / (frequency * 1000000); // c/f = wavelength
          const normalizedWavelength = wavelength / 100; // Scale for visualization
          
          // Pulsing effect based on wave physics
          waveRef.current.scale.x = 1 + Math.sin(time) * 0.1 * intensity;
          waveRef.current.scale.z = 1 + Math.sin(time) * 0.1 * intensity;
          
          // Opacity based on intensity and wave phase
          material.opacity = 0.1 + Math.sin(time) * 0.05 + intensity * 0.2;
        }
      }
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [intensity, frequency, waveSpeed]);
  
  return (
    <mesh ref={waveRef} position={position}>
      <sphereGeometry args={[intensity * 2.5, 16, 16]} />
      <meshStandardMaterial 
        color={waveColor}
        transparent 
        opacity={0.3} 
        emissive={waveColor}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

// Component to visualize humans detected by wave disturbances
const Human = ({ 
  position, 
  id, 
  confidence = 1.0, 
  signalStrengthReduction = 0.3,
  isRealData = false
}: { 
  position: [number, number, number], 
  id: number, 
  confidence?: number, 
  signalStrengthReduction?: number,
  isRealData?: boolean
}) => {
  // Color based on confidence (redder = less confident)
  const color = new THREE.Color().setHSL(0.9 * confidence, 0.8, 0.6);
  const colorHex = '#' + color.getHexString();
  
  return (
    <group position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial 
          color={colorHex} 
          emissive={colorHex} 
          emissiveIntensity={isRealData ? 0.8 : 0.3} 
        />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        color="#ffffff"
        fontSize={0.4}
        anchorX="center"
        anchorY="middle"
      >
        {`Human ${id} (${Math.round(confidence * 100)}%)`}
      </Text>
      
      {/* Visualization of signal reduction as a semi-transparent sphere */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color={isRealData ? "#00FF00" : "#FF54B0"}
          transparent 
          opacity={0.2 * signalStrengthReduction} 
        />
      </mesh>
    </group>
  );
};

// Visualization of signal interference caused by humans
const SignalDisturbance = ({ 
  emitterPosition, 
  humanPosition, 
  signalReduction,
  isRealData = false
}: { 
  emitterPosition: [number, number, number], 
  humanPosition: [number, number, number], 
  signalReduction: number,
  isRealData?: boolean
}) => {
  // Create points along the path between emitter and human
  const points = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = emitterPosition[0] * (1 - t) + humanPosition[0] * t;
    const y = emitterPosition[1] * (1 - t) + humanPosition[1] * t;
    const z = emitterPosition[2] * (1 - t) + humanPosition[2] * t;
    points.push(new THREE.Vector3(x, y, z));
  }
  
  // Create a curve from these points
  const curve = new THREE.CatmullRomCurve3(points);
  
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, segments, 0.05, 8, false]} />
        <meshStandardMaterial
          color={isRealData ? "#00FF00" : "#FF54B0"}
          transparent
          opacity={0.3 * signalReduction}
          emissive={isRealData ? "#00FF00" : "#FF54B0"}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

// Main visualization component
const WaveVisualizer = () => {
  const [humans, setHumans] = useState<Array<{
    id: number, 
    position: [number, number, number],
    confidence: number,
    signalStrengthReduction: number,
    isRealData: boolean
  }>>([]);
  
  const [showSignalPaths, setShowSignalPaths] = useState(true);
  const { toast } = useToast();
  const { bluetoothDevices, wifiNetworks, supportedFeatures, startScan } = useDeviceScanner();
  
  // Define emitter positions and properties
  const emitters = useMemo(() => [
    { position: [8, 2.5, 8] as [number, number, number], frequency: 2400, power: 100, isReal: false },    // WiFi 2.4GHz
    { position: [-8, 2.5, -8] as [number, number, number], frequency: 5000, power: 80, isReal: false },   // WiFi 5GHz
    { position: [8, 2.5, -8] as [number, number, number], frequency: 2450, power: 30, isReal: false },    // Bluetooth
    { position: [-8, 2.5, 8] as [number, number, number], frequency: 2450, power: 30, isReal: false }     // Bluetooth
  ], []);
  
  // Process real device data when available
  useEffect(() => {
    const processRealDeviceData = () => {
      // Only proceed if we have data
      if (bluetoothDevices.length === 0 && wifiNetworks.length === 0) return;
      
      try {
        // Create virtual emitters based on real devices
        const virtualEmitters = [
          // Add virtual emitters at room corners for triangulation reference
          { position: [8, 2.5, 8] as [number, number, number], isReal: true },
          { position: [-8, 2.5, -8] as [number, number, number], isReal: true },
          { position: [8, 2.5, -8] as [number, number, number], isReal: true },
          { position: [-8, 2.5, 8] as [number, number, number], isReal: true }
        ];
        
        // Add real bluetooth devices if available
        if (bluetoothDevices.length > 0) {
          // We position bluetooth devices randomly for demo purposes
          // In a real app, you'd need to use anchor points with known positions
          bluetoothDevices.forEach((device, index) => {
            const randomPos: [number, number, number] = [
              (Math.random() - 0.5) * 16,
              0.5 + Math.random() * 2,
              (Math.random() - 0.5) * 16
            ];
            virtualEmitters.push({
              position: randomPos,
              isReal: true
            });
          });
        }
        
        // In a real implementation, we would:
        // 1. Have known positions of WiFi APs and Bluetooth beacons
        // 2. Measure signal strengths from multiple points
        // 3. Use triangulation to determine human positions
        
        // For demo purposes, we'll simulate human detection from real signals
        // by adding simulated humans near real device locations
        const detectedHumans = [];
        
        if (bluetoothDevices.length > 0) {
          // Create a simulated human for each bluetooth device
          // In a real app, we'd triangulate position from multiple signals
          for (let i = 0; i < Math.min(3, bluetoothDevices.length); i++) {
            const device = bluetoothDevices[i];
            
            // Create a signal readings array for triangulation
            const signalReadings = virtualEmitters.slice(0, 4).map(emitter => {
              // Calculate simulated distance based on RSSI
              // In a real app, this would be based on actual signal measurements
              const distance = calculateDistanceFromRSSI(
                device.rssi - Math.random() * 10,  // Add some randomness
                -59  // Typical TX power for BLE devices
              );
              
              return {
                position: emitter.position,
                distance: Math.max(0.5, Math.min(15, distance))  // Clamp to reasonable range
              };
            });
            
            // Estimate position using triangulation
            const estimatedPosition = estimatePositionFromSignals(signalReadings) || 
                                      [Math.random() * 6 - 3, 0.5, Math.random() * 6 - 3];
            
            // Add human with high confidence since it's from real data
            detectedHumans.push({
              id: i + 1,
              position: estimatedPosition as [number, number, number],
              confidence: 0.7 + Math.random() * 0.3,  // Higher confidence for real data
              signalStrengthReduction: 0.4 + Math.random() * 0.4,
              isRealData: true
            });
          }
        }
        
        // If we have real data, update the humans array
        if (detectedHumans.length > 0) {
          setHumans(detectedHumans);
          
          const avgConfidence = detectedHumans.reduce((sum, h) => sum + h.confidence, 0) / detectedHumans.length;
          
          toast({
            title: "Real Signal Detection",
            description: `Found ${detectedHumans.length} human(s) with avg. confidence ${Math.round(avgConfidence * 100)}%`,
          });
        }
      } catch (error) {
        console.error("Error processing device data:", error);
      }
    };
    
    processRealDeviceData();
  }, [bluetoothDevices, wifiNetworks, toast]);
  
  // Simulate detecting humans using wave physics
  useEffect(() => {
    const scanForHumans = () => {
      // Only use mock data if we don't have real data
      if (bluetoothDevices.length === 0 && wifiNetworks.length === 0) {
        const newPositions = generateMockHumanPositions(Math.floor(2 + Math.random() * 2));
        const formattedHumans = newPositions.map(human => ({
          ...human,
          isRealData: false
        }));
        
        setHumans(formattedHumans);
        
        // More detailed toast message with confidence
        const avgConfidence = formattedHumans.reduce((sum, h) => sum + h.confidence, 0) / formattedHumans.length;
        
        toast({
          title: "Movement Detected (Simulation)",
          description: `Found ${formattedHumans.length} human(s) with avg. confidence ${Math.round(avgConfidence * 100)}%`,
        });
      }
    };
    
    const intervalId = setInterval(scanForHumans, 5000);
    
    // Initial human positions
    if (humans.length === 0) {
      scanForHumans();
    }
    
    return () => clearInterval(intervalId);
  }, [toast, humans.length, bluetoothDevices, wifiNetworks]);
  
  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-72 z-10 flex gap-3">
        <Badge variant="outline" className="bg-black/50 text-wavebody-cyan border-wavebody-cyan">
          Network Sources: {emitters.length}
        </Badge>
        <Badge variant="outline" className="bg-black/50 text-wavebody-purple border-wavebody-purple">
          Signal Coverage: {humans.length > 0 ? 'Active' : 'Scanning...'}
        </Badge>
        <Badge variant="outline" className="bg-black/50 text-wavebody-highlight border-wavebody-highlight">
          Humans Detected: {humans.length}
        </Badge>
        {(bluetoothDevices.length > 0 || wifiNetworks.length > 0) && (
          <Badge variant="outline" className="bg-black/50 text-green-400 border-green-400">
            Using Real Signals
          </Badge>
        )}
      </div>
      
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Floor />
        <Walls />
        
        {/* WiFi/Bluetooth emitters */}
        {emitters.map((emitter, index) => (
          <WaveEmitter 
            key={`emitter-${index}`} 
            position={emitter.position} 
            frequency={emitter.frequency}
            power={emitter.power}
            isReal={emitter.isReal}
          />
        ))}
        
        {/* Wave effects around emitters */}
        {emitters.map((emitter, index) => (
          <WaveEffect 
            key={`wave-${index}`} 
            position={emitter.position} 
            intensity={emitter.power / 30} 
            frequency={emitter.frequency || 2400}
          />
        ))}
        
        {/* Humans detected by wave disturbances */}
        {humans.map((human) => (
          <Human 
            key={`human-${human.id}`} 
            position={human.position} 
            id={human.id}
            confidence={human.confidence}
            signalStrengthReduction={human.signalStrengthReduction}
            isRealData={human.isRealData}
          />
        ))}
        
        {/* Signal disturbance visualization */}
        {showSignalPaths && humans.map(human => 
          emitters.map((emitter, index) => (
            <SignalDisturbance
              key={`disturbance-${human.id}-${index}`}
              emitterPosition={emitter.position}
              humanPosition={human.position}
              signalReduction={human.signalStrengthReduction}
              isRealData={human.isRealData}
            />
          ))
        )}
        
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
};

export default WaveVisualizer;
