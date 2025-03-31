
import { execSync } from 'child_process';

console.log('Installing Electron dependencies...');

try {
  // Install Electron dependencies
  execSync('npm install electron electron-is-dev node-wifi node-bluetooth --save-dev', { stdio: 'inherit' });
  console.log('Electron dependencies installed successfully!');
} catch (error) {
  console.error('Error installing Electron dependencies:', error);
  process.exit(1);
}
