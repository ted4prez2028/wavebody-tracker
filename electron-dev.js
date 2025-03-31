
import concurrently from 'concurrently';
import waitOn from 'wait-on';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start Vite dev server
console.log('Starting Vite dev server...');
concurrently([
  { 
    command: 'npm run dev',
    name: 'vite',
    prefixColor: 'blue'
  }
]).then(() => {}, () => {});

// Wait for Vite server to be ready
waitOn({
  resources: ['http://localhost:8080'],
  timeout: 30000
}).then(() => {
  console.log('Vite server is ready, starting Electron...');
  
  // Start Electron
  const electronProcess = spawn('npx', ['electron', path.join(__dirname, 'electron/main.mjs')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON: 'true'
    }
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    process.exit(code);
  });
}).catch((error) => {
  console.error('Error waiting for Vite server:', error);
  process.exit(1);
});
