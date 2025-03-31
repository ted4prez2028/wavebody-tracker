
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start Electron
console.log('Starting Electron...');
const electronProcess = spawn('npx', ['electron', path.join(__dirname, 'electron/main.mjs')], {
  stdio: 'inherit'
});

electronProcess.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
});
