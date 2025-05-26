#!/usr/bin/env node

/**
 * Helper utility to check if port 4000 is accessible from the network
 * and provide instructions for allowing it through the Windows firewall
 */

const http = require('http');
const os = require('os');
const { execSync } = require('child_process');

// Get network interfaces
const interfaces = os.networkInterfaces();
const externalIps = [];

// Find all external IPs
for (const [name, ifaces] of Object.entries(interfaces)) {
  if (!ifaces) continue;
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      externalIps.push({ name: name, address: iface.address });
    }
  }
}

console.log('🔥 Firewall Port Checker 🔥');
console.log('===========================');
console.log('\nChecking if port 4000 is accessible from the network...');

// Create a simple server on all network interfaces to test if it's accessible
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Port 4000 is accessible!');
});

// Try to listen on the specified port
server.listen(4000, '0.0.0.0', () => {
  const serverAddress = server.address();
  console.log(`\n✅ Server is listening on port ${serverAddress.port}`);
  console.log('\nYou can access the server at:');
  
  externalIps.forEach(ip => {
    console.log(`http://${ip.address}:4000`);
  });
  
  console.log('\n🧪 Testing access to these URLs from your Android device...');
  console.log('If your app cannot connect, follow these steps:');
  console.log('\n1. Open Windows Defender Firewall with Advanced Security');
  console.log('2. Click on "Inbound Rules" in the left panel');
  console.log('3. Click "New Rule..." in the right panel');
  console.log('4. Select "Port" and click Next');
  console.log('5. Select "TCP" and enter "4000" for the port');
  console.log('6. Select "Allow the connection" and click Next');
  console.log('7. Select all network types (Domain, Private, Public) and click Next');
  console.log('8. Name the rule "Expo Backend Server" and click Finish');
  
  console.log('\nPress Ctrl+C to exit this checker\n');
});

// Handle errors (e.g., if the port is already in use)
server.on('error', (err) => {
  console.log(`❌ Error: ${err.message}`);
  
  if (err.code === 'EADDRINUSE') {
    console.log('\nPort 4000 is already in use.');
    console.log('If your backend server is running, this is expected.');
    console.log('\nTo check if the port is accessible, try:');
    
    externalIps.forEach(ip => {
      console.log(`- Open http://${ip.address}:4000 in a browser on your Android device`);
    });
    
    console.log('\nIf you cannot access it, follow the firewall instructions above.');
    
    try {
      // Check for firewall status (Windows only)
      if (process.platform === 'win32') {
        console.log('\nChecking Windows Firewall status...');
        const firewallOutput = execSync('netsh advfirewall show allprofiles state').toString();
        console.log(firewallOutput);
        
        console.log('\nChecking if Node.js is allowed through the firewall...');
        const firewallRulesOutput = execSync('netsh advfirewall firewall show rule name=all | findstr "Node.js"').toString();
        if (firewallRulesOutput.length > 0) {
          console.log('Found Node.js firewall rules:');
          console.log(firewallRulesOutput);
        } else {
          console.log('No Node.js rules found in firewall. You should add one.');
        }
      }
    } catch (error) {
      console.log('\nCould not check firewall status automatically.');
    }
  }
}); 