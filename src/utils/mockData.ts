
// Constants for wave physics calculations
const WAVE_SPEED = 299792458; // Speed of EM waves (m/s)
const HUMAN_WATER_CONTENT = 0.6; // Humans are ~60% water
const WATER_DIELECTRIC_CONSTANT = 80; // Dielectric constant of water
const AIR_DIELECTRIC_CONSTANT = 1.0006; // Dielectric constant of air
const ROOM_SCALE = 10; // 20m x 20m room (scale factor for visualization)

// Calculate wave attenuation when passing through a human body
const calculateWaveAttenuation = (distance: number, frequency: number) => {
  // Using inverse square law for signal strength
  const baseAttenuation = 1 / (distance * distance);
  
  // Higher frequencies attenuate more in human tissue
  // Simplified model: higher frequencies (like 5GHz) attenuate more than lower ones (like 2.4GHz)
  const frequencyFactor = Math.pow(frequency / 2400, 1.5);
  
  return baseAttenuation / frequencyFactor;
};

// Calculate signal delay when passing through human body
const calculateSignalDelay = (distanceToHuman: number, humanSize: number, frequency: number) => {
  // Human tissue slows down the wave propagation
  const airMediumVelocity = WAVE_SPEED / Math.sqrt(AIR_DIELECTRIC_CONSTANT);
  const humanMediumVelocity = WAVE_SPEED / Math.sqrt(WATER_DIELECTRIC_CONSTANT * HUMAN_WATER_CONTENT + 
                                                     AIR_DIELECTRIC_CONSTANT * (1 - HUMAN_WATER_CONTENT));
  
  // Time in air = distance / velocity in air
  const timeInAir = distanceToHuman / airMediumVelocity;
  
  // Time in human = human size / velocity in human tissue
  const timeInHuman = humanSize / humanMediumVelocity;
  
  // Total delay compared to air-only path
  return (timeInAir + timeInHuman) - (distanceToHuman + humanSize) / airMediumVelocity;
};

// Calculate the position of a human based on signal delays from multiple emitters
export const detectHumanPositions = (emitterPositions: Array<[number, number, number]>, signalDelays: number[]) => {
  // This is a simplified multilateration algorithm
  // In real applications, this would use more complex algorithms like TDOA (Time Difference of Arrival)
  const detectedHumans = [];
  
  // For demo purposes, we'll use a simplified approach that simulates detected positions
  // In reality, this would solve a system of equations based on measured signal delays
  for (let i = 0; i < 3; i++) { // Simulate detecting 3 humans
    // Create positions that avoid walls
    let x = (Math.random() - 0.5) * 18;
    let z = (Math.random() - 0.5) * 18;
    
    // Avoid the middle wall at x = -5
    if (x < -4 && x > -6) {
      x = x < -5 ? -6.5 : -3.5;
    }
    
    // Avoid the wall at z = -5 in the right section
    if (x > 0 && z < -4 && z > -6) {
      z = z < -5 ? -6.5 : -3.5;
    }
    
    // Calculate "confidence" based on signal characteristics
    // Higher confidence for positions with more consistent signal measurements
    const confidence = 0.5 + 0.5 * Math.random();
    
    detectedHumans.push({
      id: i + 1,
      position: [x, 0.5, z] as [number, number, number],
      confidence: confidence,
      signalStrengthReduction: 0.2 + 0.3 * Math.random() // 20-50% signal reduction
    });
  }
  
  return detectedHumans;
};

// Generate human positions based on wave physics simulation
export const generateMockHumanPositions = (count: number) => {
  // Define emitter positions (WiFi/Bluetooth sources)
  const emitterPositions: Array<[number, number, number]> = [
    [8, 2.5, 8],
    [-8, 2.5, -8],
    [8, 2.5, -8],
    [-8, 2.5, 8]
  ];
  
  // Simulate signal delays for multilateration
  const signalDelays = emitterPositions.map(() => Math.random() * 0.000000005); // nanosecond delays
  
  return detectHumanPositions(emitterPositions, signalDelays);
};

// Calculate wave intensity at a given point
export const calculateWaveIntensity = (
  emitterPosition: [number, number, number], 
  point: [number, number, number],
  frequency: number = 2400, // Default 2.4GHz
  power: number = 100 // Default power in mW
) => {
  // Calculate distance between emitter and point
  const dx = emitterPosition[0] - point[0];
  const dy = emitterPosition[1] - point[1];
  const dz = emitterPosition[2] - point[2];
  const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
  
  // Use inverse square law for signal propagation
  const intensity = power / (4 * Math.PI * distance * distance);
  
  // Add frequency-dependent attenuation
  const wavelength = WAVE_SPEED / (frequency * 1000000); // Convert MHz to Hz
  const attenuationFactor = Math.exp(-distance / (wavelength * 10)); // Simplified attenuation model
  
  return intensity * attenuationFactor;
};

