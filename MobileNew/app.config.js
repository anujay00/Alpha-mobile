module.exports = {
  expo: {
    name: "Mooori Mobile",
    slug: "mooori-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/adaptive-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mooori.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mooori.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      },
      // Environment variables accessible in the app
      // Using the actual local network IP address
      EXPO_PUBLIC_BACKEND_URL: "http://10.16.135.0:4000",
      
      // For Android emulators only:
      // EXPO_PUBLIC_BACKEND_URL: "http://10.0.2.2:4000",
      
      // iOS SIMULATOR: Use localhost
      // EXPO_PUBLIC_BACKEND_URL: "http://127.0.0.1:4000",
      
      // Default port for backend
      BACKEND_PORT: 4000,
      
      // Define environment
      ENV: "development",
      
      // Enable new architecture
      newArchEnabled: true
    }
  }
}; 