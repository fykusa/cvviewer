import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

function buildCounterPlugin() {
  return {
    name: 'build-counter',
    config() {
      const pkgPath = path.resolve(__dirname, 'package.json');
      const counterPath = path.resolve(__dirname, '.build-counter.json');

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const currentVersion = pkg.version;

      let counterData = { version: currentVersion, counter: 0 };
      if (fs.existsSync(counterPath)) {
        try {
          counterData = JSON.parse(fs.readFileSync(counterPath, 'utf-8'));
        } catch { /* start fresh */ }
      }

      // Reset counter if version changed
      if (counterData.version !== currentVersion) {
        counterData.version = currentVersion;
        counterData.counter = 0;
      }

      counterData.counter++;

      fs.writeFileSync(counterPath, JSON.stringify(counterData, null, 2) + '\n');

      const padded = String(counterData.counter).padStart(3, '0');
      const fullVersion = `${currentVersion}-${padded}`;

      return {
        define: {
          __APP_VERSION__: JSON.stringify(fullVersion),
        },
      };
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [buildCounterPlugin(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});