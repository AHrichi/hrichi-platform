import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Android shell around the field app (ADR-0026). Build the web app,
 * then `pnpm nx run product-greenhouse-field:cap-sync`. The `android/`
 * project is added with `pnpm exec cap add android` from this folder.
 */
const config: CapacitorConfig = {
  appId: 'dev.hrichi.greenhouse.field',
  appName: 'Field log',
  webDir: '../../../../dist/apps/products/greenhouse/field/browser',
  android: {
    // Phones in the field stay on whatever WebView they shipped with.
    minWebViewVersion: 90,
  },
};

export default config;
