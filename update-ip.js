#!/usr/bin/env node

/**
 * Helper utility to update the app.config.js with the correct IP address
 * for physical device connections
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('📱 Mobile App IP Address Updater 📱');
console.log('===================================');

// Get network interfaces
const interfaces = os.networkInterfaces();
let externalIps = [];

// Find all external IPs
console.log('\nScanning network interfaces...');
for (const [name, ifaces] of Object.entries(interfaces)) {
  if (!ifaces) continue;
  
  for (const iface of ifaces) {
    // Skip IPv6 and internal interfaces
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`- Found interface ${name}: ${iface.address}`);
      externalIps.push({ 
        name: name, 
        address: iface.address 
      });
    }
  }
}

// Log all found IPs
if (externalIps.length === 0) {
  console.log('\n❌ No external IP addresses found. Using fallback address.');
  console.log('Try running ipconfig or ifconfig manually to find your IP address.');
  externalIps.push({ name: 'Fallback', address: '192.168.1.2' });
} else {
  console.log(`\nFound ${externalIps.length} external IP address(es):`);
  externalIps.forEach((ip, index) => {
    console.log(`${index + 1}. ${ip.name}: ${ip.address}`);
  });
}

// Default to the first external IP
let selectedIp = externalIps[0].address;
console.log(`\nUsing IP address: ${selectedIp}`);

// Function to update app.config.js
function updateAppConfig(ipAddress) {
  try {
    const appConfigPath = path.join(__dirname, 'MooooriMobileNew', 'app.config.js');
    console.log(`Looking for app.config.js at: ${appConfigPath}`);
    
    if (!fs.existsSync(appConfigPath)) {
      console.log(`❌ Could not find app.config.js at ${appConfigPath}`);
      return false;
    }
    
    let content = fs.readFileSync(appConfigPath, 'utf8');
    console.log('Found app.config.js, updating...');
    
    // Replace the EXPO_PUBLIC_BACKEND_URL line
    content = content.replace(
      /EXPO_PUBLIC_BACKEND_URL:.*$/m,
      `EXPO_PUBLIC_BACKEND_URL: "http://${ipAddress}:4000",`
    );
    
    fs.writeFileSync(appConfigPath, content);
    console.log(`✅ Updated app.config.js with IP: ${ipAddress}`);
    return true;
  } catch (error) {
    console.log('❌ Error updating app.config.js:', error.message);
    return false;
  }
}

// Update the app.config.js file
if (updateAppConfig(selectedIp)) {
  console.log('\n🎉 Success! Your app is now configured for physical devices.');
  console.log(`\nTo connect your physical device to the backend at http://${selectedIp}:4000:`);
  console.log('1. Make sure your device is on the same WiFi network as your computer');
  console.log('2. Ensure your backend server is running (cd backend && npm run dev)');
  console.log('3. Restart your Expo app (npx expo start -c)');
  console.log('\nIf you still have connection issues, try:');
  console.log('- Check your firewall settings to allow incoming connections on port 4000');
  console.log('- Try a different IP address by editing app.config.js manually');
} else {
  console.log('\n❌ Failed to update configuration. Check the error message above.');
} 