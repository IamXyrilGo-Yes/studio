
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xyloan.app',
  appName: 'Xy Loan',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // Do NOT set a server.url for production; this ensures static assets are loaded locally
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
