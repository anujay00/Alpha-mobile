#!/usr/bin/env node

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');
const net = require('net');

// Configuration
const ports = [4000, 3000, 8000];
const ips = [
  '127.0.0.1',         // Local loopback
  'localhost',         // Named loopback
  '10.0.2.2',          // Android emulator -> host loopback
  '192.168.1.2',       // Common local network IP
  '192.168.1.3',       // Common router IP
  '192.168.0.1',       // Another common router IP
  '192.168.43.1',      // Common Android hotspot
  '172.20.10.1'        // Common iOS hotspot
];

console.log('===============================');
console.log('Backend Connection Diagnostics');
console.log('===============================');

// Platform detection for the script
const isWin = process.platform === 'win32';

// Check network interfaces
console.log('\n[1] Network Interfaces:');
const interfaces = os.networkInterfaces();
let localIPs = [];

for (const [name, netInterface] of Object.entries(interfaces)) {
  netInterface.forEach(details => {
    if (details.family === 'IPv4') {
      console.log(`  - ${name}: ${details.address} (${details.internal ? 'internal' : 'external'})`);
      if (!details.internal) {
        localIPs.push(details.address);
      }
    }
  });
}

// Check DNS resolution
console.log('\n[2] DNS Resolution:');
try {
  dns.lookup('google.com', (err, address) => {
    if (err) {
      console.log('  ❌ DNS resolution failed:', err.message);
    } else {
      console.log('  ✅ DNS resolution working:', address);
    }
  });
} catch (error) {
  console.log('  ❌ DNS resolution error:', error.message);
}

// Check backend server
console.log('\n[3] Backend Server Connection Tests:');
async function checkBackendEndpoint(url, timeout = 3000) {
  try {
    console.log(`  Checking ${url}...`);
    const response = await axios.get(url, { timeout });
    console.log(`  ✅ Connected to ${url} - Status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`  ❌ Connection refused at ${url}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`  ❌ Connection timed out at ${url}`);
    } else if (error.response) {
      console.log(`  ⚠️ Server responded with ${error.response.status} at ${url}`);
    } else {
      console.log(`  ❌ Failed to connect to ${url}: ${error.message}`);
    }
    return false;
  }
}

// Test for port availability
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false); // Port is in use
    });
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    server.listen(port);
  });
}

// Generate platform-specific server configurations
async function generateMobileAppConfig(workingUrl) {
  if (!workingUrl) return;
  
  try {
    // Create the react-native.config.js file
    const rnConfigPath = path.join(__dirname, 'MooooriMobileNew', 'react-native.config.js');
    const rnConfigContent = `
module.exports = {
  server: {
    port: 8081,
    host: '0.0.0.0',
  },
  env: {
    BACKEND_URL: '${workingUrl}',
  },
};
    `;
    fs.writeFileSync(rnConfigPath, rnConfigContent);
    console.log(`  ✅ Created React Native config at ${rnConfigPath}`);
    
    // Create a .env file for environment variables
    const envPath = path.join(__dirname, 'MooooriMobileNew', '.env');
    const envContent = `EXPO_PUBLIC_BACKEND_URL=${workingUrl}`;
    fs.writeFileSync(envPath, envContent);
    console.log(`  ✅ Created .env file at ${envPath}`);
  } catch (e) {
    console.log('  ⚠️ Error creating mobile configuration files:', e.message);
  }
}

async function checkBackendConnectivity() {
  // Test all IP and port combinations
  console.log('\n  Testing all IP and port combinations:');
  let anySuccessful = false;
  let workingUrl = null;
  
  // First try with host's local IPs since these are more likely to work with physical devices
  console.log('\n  Checking host machine IPs:');
  for (const localIP of localIPs) {
    if (localIP.startsWith('127.')) continue; // Skip loopback addresses
    
    for (const port of ports) {
      const baseUrl = `http://${localIP}:${port}`;
      const success = await checkBackendEndpoint(`${baseUrl}/api/health`);
      if (success) {
        anySuccessful = true;
        workingUrl = baseUrl;
        console.log(`  🎉 Found working backend at ${baseUrl} (HOST IP - BEST FOR PHYSICAL DEVICES)`);
        break;
      }
    }
    if (anySuccessful) break;
  }
  
  // If not successful, try with all other IPs
  if (!anySuccessful) {
    console.log('\n  Checking common platform IPs:');
    for (const ip of ips) {
      for (const port of ports) {
        await isPortAvailable(port).then(available => {
          if (!available && ip === '127.0.0.1' || ip === 'localhost') {
            console.log(`  - Port ${port} is in use on ${ip} - this is good!`);
          }
        });
        
        const baseUrl = `http://${ip}:${port}`;
        const success = await checkBackendEndpoint(`${baseUrl}/api/health`);
        if (success) {
          anySuccessful = true;
          workingUrl = baseUrl;
          
          if (ip === '10.0.2.2') {
            console.log(`  🎉 Found working backend at ${baseUrl} (ANDROID EMULATOR)`);
          } else if (ip === '127.0.0.1' || ip === 'localhost') {
            console.log(`  🎉 Found working backend at ${baseUrl} (LOCAL - GOOD FOR IOS/WEB)`);
          } else {
            console.log(`  🎉 Found working backend at ${baseUrl}`);
          }
          break;
        }
      }
      if (anySuccessful) break;
    }
  }
  
  if (anySuccessful && workingUrl) {
    // Try to update the configurations
    try {
      const appConfigPath = path.join(__dirname, 'MooooriMobileNew', 'app.config.js');
      if (fs.existsSync(appConfigPath)) {
        let content = fs.readFileSync(appConfigPath, 'utf8');
        content = content.replace(
          /EXPO_PUBLIC_BACKEND_URL:.*$/m,
          `EXPO_PUBLIC_BACKEND_URL: "${workingUrl}",`
        );
        fs.writeFileSync(appConfigPath, content);
        console.log(`  ✅ Updated app.config.js with backend URL: ${workingUrl}`);
      }
      
      // Generate mobile app config files
      await generateMobileAppConfig(workingUrl);
      
      // Create a simple access script
      const helper = `
#!/usr/bin/env node
// IMPORTANT: Special IPs for different platforms:
// - ANDROID EMULATOR: Connect to host using http://10.0.2.2:${workingUrl.split(':')[2]}
// - ANDROID PHYSICAL DEVICE: Connect to host's network IP (one of: ${localIPs.join(', ')})
// - iOS SIMULATOR: Connect to host using http://localhost:${workingUrl.split(':')[2]} or http://127.0.0.1:${workingUrl.split(':')[2]}

// Working backend URL: ${workingUrl}
console.log('Working backend URL found: ${workingUrl}');
console.log('Run backend diagnostics anytime with: node check-backend.js');
      `;
      
      fs.writeFileSync(path.join(__dirname, 'backend-url.js'), helper);
      console.log(`  ✅ Created backend-url.js helper`);
    } catch (e) {
      console.log('  ⚠️ Could not update app config:', e.message);
    }
  }
  
  if (!anySuccessful) {
    console.log('\n  ❌ Could not connect to backend on any IP/port combination');
    console.log('  Please make sure your backend server is running with:');
    console.log('  cd backend && npm run dev\n');
    console.log('  For Android devices, ensure your computer firewall allows connections on port 4000');
  }
}

// Check if backend server is running on this device
console.log('\n[4] Checking for Backend Process:');
try {
  let processFound = false;
  
  if (isWin) {
    const output = execSync('tasklist').toString();
    if (output.includes('node.exe')) {
      console.log('  ✅ Node process found running');
      processFound = true;
    }
  } else {
    const output = execSync('ps aux | grep node').toString();
    if (output.includes('server.js')) {
      console.log('  ✅ Backend process found running');
      processFound = true;
    }
  }
  
  if (!processFound) {
    console.log('  ❌ No backend process detected');
    console.log('  Starting backend server...');
    
    try {
      // Try to start the backend
      execSync('cd backend && npx nodemon server.js', { stdio: 'inherit' });
    } catch (startError) {
      console.log('  ⚠️ Could not automatically start backend server');
      console.log(`  Run this command manually: cd backend && npm run dev`);
    }
  }
} catch (error) {
  console.log('  ⚠️ Could not check for running processes:', error.message);
}

// Check if firewall might be blocking connections
console.log('\n[5] Checking for potential firewall issues:');
try {
  if (isWin) {
    console.log('  If you\'re having issues with Android device connections:');
    console.log('  1. Open Windows Defender Firewall');
    console.log('  2. Click "Allow an app or feature through Windows Defender Firewall"');
    console.log('  3. Add Node.js and allow it on private/public networks');
    console.log('  4. Also ensure port 4000 is open for TCP connections');
  } else {
    console.log('  If you\'re having issues with Android device connections:');
    console.log('  1. Check your firewall settings to allow connections on port 4000');
    console.log('  2. Run: sudo ufw allow 4000/tcp (on Ubuntu/Debian)');
  }
} catch (error) {
  console.log('  Error checking firewall status:', error.message);
}

// Run the connectivity checks
checkBackendConnectivity().then(() => {
  console.log('\n===============================');
  console.log('Diagnosis complete!');
  console.log('===============================');
  
  // Provide explicit instructions for Android
  console.log('\nCONNECTION GUIDE FOR ANDROID DEVICES:');
  console.log('1. If using an emulator: Use the special IP 10.0.2.2 instead of localhost');
  console.log(`2. If using a physical device: Connect to your computer's network IP (${localIPs.join(' or ')})`);
  console.log('3. Ensure your computer\'s firewall allows incoming connections on port 4000');
  console.log('4. Make sure your device and computer are on the same network');
}); 