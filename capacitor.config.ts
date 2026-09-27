import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisr.procounter',
  appName: 'حِصر',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: true,
  },
};

export default config;
