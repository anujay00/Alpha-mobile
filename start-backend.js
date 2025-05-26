/**
 * Helper script to check if the backend server is running and start it if needed
 */
const { exec } = require('child_process');
const http = require('http');
const path = require('path');

// Function to check if the server is running
function checkServerRunning() {
  return new Promise((resolve) => {
    // Try to connect to the server
    const req = http.get('http://localhost:4000', (res) => {
      console.log(`✅ Backend server is already running (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', () => {
      console.log('⚠️ Backend server is not running');
      resolve(false);
    });

    // Set a timeout for the request
    req.setTimeout(1000, () => {
      req.abort();
      resolve(false);
    });
  });
}

// Function to start the server
function startServer() {
  console.log('🚀 Starting backend server...');
  
  // Get the absolute path to the backend directory
  const backendPath = path.join(__dirname, 'backend');
  
  // Check if we're on Windows
  const isWindows = process.platform === 'win32';
  
  // Create the appropriate command based on the OS
  const command = isWindows
    ? `cd "${backendPath}" && npm start`
    : `cd "${backendPath}" && npm start`;
  
  // Execute the command
  const serverProcess = exec(command);
  
  // Log outputs from the server process
  serverProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
  
  // Handle server process exit
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend server exited with code ${code}`);
    } else {
      console.log('✅ Backend server stopped gracefully');
    }
  });

  console.log('Backend server process started');
  console.log('Press CTRL+C to stop');
}

// Main function
async function main() {
  console.log('Checking if backend server is running...');
  
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    startServer();
  } else {
    console.log('You can now start the mobile app with "npm start" in the MooooriMobileNew directory');
  }
}

// Run the main function
main().catch(console.error); 