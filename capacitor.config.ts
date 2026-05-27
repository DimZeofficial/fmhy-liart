import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dimzeofficial.fnmy',
  appName: 'FNMY',
  webDir: 'docs/.vitepress/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    // Enable debugging so you can inspect your layout while testing
    webContentsDebuggingEnabled: true
  }
}

export default config
