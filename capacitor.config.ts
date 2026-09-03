import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xyloan.app',
  appName: 'Xy Loan',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
