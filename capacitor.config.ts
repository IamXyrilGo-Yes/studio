
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pisomate.app',
  appName: 'PisoMate',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
