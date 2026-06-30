import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.syncpedia.app',
  appName: 'Syncpedia',
  webDir: '.output/public',
  server: {
    url: 'https://app.syncpedia.in',
    cleartext: false,
  },
};

export default config;
