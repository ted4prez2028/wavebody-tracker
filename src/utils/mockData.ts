
// Generate random human positions within the building
export const generateMockHumanPositions = (count: number) => {
  const humans = [];
  
  for (let i = 0; i < count; i++) {
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
    
    humans.push({
      id: i + 1,
      position: [x, 0.5, z] as [number, number, number]
    });
  }
  
  return humans;
};
