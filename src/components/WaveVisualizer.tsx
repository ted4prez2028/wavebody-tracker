
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { generateMockHumanPositions } from '../utils/mockData';

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
const WaveEmitter = ({ position }: { position: [number, number, number] }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#4A74FF" emissive="#4A74FF" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Component to create wave visualizations
const WaveEffect = ({ position, intensity }: { position: [number, number, number], intensity: number }) => {
  const waveRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!waveRef.current) return;
    
    const animate = () => {
      if (waveRef.current) {
        waveRef.current.scale.x = 1 + Math.sin(Date.now() * 0.002) * 0.1;
        waveRef.current.scale.z = 1 + Math.sin(Date.now() * 0.002) * 0.1;
        waveRef.current.material.opacity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
      }
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <mesh ref={waveRef} position={[position[0], position[1], position[2]]}>
      <sphereGeometry args={[intensity, 16, 16]} />
      <meshStandardMaterial 
        color="#A45CFF" 
        transparent 
        opacity={0.3} 
        emissive="#A45CFF"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

// Component to visualize humans detected by wave disturbances
const Human = ({ position, id }: { position: [number, number, number], id: number }) => {
  return (
    <group position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial color="#FF54B0" emissive="#FF54B0" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        color="#ffffff"
        fontSize={0.4}
        anchorX="center"
        anchorY="middle"
      >
        {`Human ${id}`}
      </Text>
    </group>
  );
};

// Main visualization component
const WaveVisualizer = () => {
  const [humans, setHumans] = useState<{id: number, position: [number, number, number]}[]>([]);
  const { toast } = useToast();
  
  // Simulate detecting humans
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newPositions = generateMockHumanPositions(3);
      setHumans(newPositions);
      
      toast({
        title: "Movement Detected",
        description: `Found ${newPositions.length} human(s) in the building`,
      });
    }, 5000);
    
    // Initial human positions
    setHumans(generateMockHumanPositions(2));
    
    return () => clearInterval(intervalId);
  }, [toast]);
  
  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-72 z-10 flex gap-3">
        <Badge variant="outline" className="bg-black/50 text-wavebody-cyan border-wavebody-cyan">
          Network Sources: 4
        </Badge>
        <Badge variant="outline" className="bg-black/50 text-wavebody-purple border-wavebody-purple">
          Signal Strength: High
        </Badge>
        <Badge variant="outline" className="bg-black/50 text-wavebody-highlight border-wavebody-highlight">
          Humans Detected: {humans.length}
        </Badge>
      </div>
      
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Floor />
        <Walls />
        
        {/* WiFi/Bluetooth emitters */}
        <WaveEmitter position={[8, 2.5, 8]} />
        <WaveEmitter position={[-8, 2.5, -8]} />
        <WaveEmitter position={[8, 2.5, -8]} />
        <WaveEmitter position={[-8, 2.5, 8]} />
        
        {/* Wave effects around emitters */}
        <WaveEffect position={[8, 2.5, 8]} intensity={3} />
        <WaveEffect position={[-8, 2.5, -8]} intensity={3} />
        <WaveEffect position={[8, 2.5, -8]} intensity={3} />
        <WaveEffect position={[-8, 2.5, 8]} intensity={3} />
        
        {/* Humans detected by wave disturbances */}
        {humans.map((human) => (
          <Human key={human.id} position={human.position} id={human.id} />
        ))}
        
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
};

export default WaveVisualizer;
