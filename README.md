
## point every time nsbm

1. First, update MooooriMobileNew/app.config.js:
// Change FROM
EXPO_PUBLIC_BACKEND_URL: "http://192.168.1.6:4000",

// Change TO
EXPO_PUBLIC_BACKEND_URL: "http://192.168.129.115:4000",

2. Next, update MooooriMobileNew/constants.js:
// Change FROM
const backendUrl = "http://192.168.1.6:4000";

// Change TO
const backendUrl = "http://192.168.129.115:4000";

3. Optionally, you can update the logs in backend/server.js:
// Change FROM
console.log(`- Network: http://192.168.137.1:${port}`);
console.log(`- Network: http://192.168.1.2:${port}`);

// Change TO
console.log(`- Network: http://192.168.129.115:${port}`);
// You can keep one of the old lines as a fallback

4.useApiclient.js
const baseUrl = "new one";

up to 4 is enough

5.ConnectionManager.js
let urls = [
   "new one",
   backendUrl
]

6.BackendConfig.js
  return [
    'http://192.168.129.115:4000', // Current WiFi IP
    'http://192.168.137.1:4000',   // From network diagnostic
    'http://192.168.1.2:4000',     // Common local network
    'http://192.168.1.3:4000',     // Another common pattern
    'http://192.168.0.1:4000',     // Another router pattern
    'http://10.0.2.2:4000',        // Android emulator fallback
  ];
optional