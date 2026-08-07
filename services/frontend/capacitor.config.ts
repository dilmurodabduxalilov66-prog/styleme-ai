import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.styleme.ai',
  appName: 'StyleMe AI',
  webDir: 'public',
  server: {
    url: 'https://styleme.uz',
    cleartext: true
  }
};

export default config;
