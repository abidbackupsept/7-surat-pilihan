import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      base: './',
      plugins: [
        react(),
        {
          name: 'copy-pwa-files',
          generateBundle() {
            // Copy service worker
            if (fs.existsSync('./service-worker.js')) {
              this.emitFile({
                type: 'asset',
                fileName: 'service-worker.js',
                source: fs.readFileSync('./service-worker.js', 'utf-8')
              });
            }
            
            // Copy manifest
            if (fs.existsSync('./manifest.json')) {
              this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: fs.readFileSync('./manifest.json', 'utf-8')
              });
            }
            
            // Copy icons
            ['icon_180.png', 'icon_192.png', 'icon_512.png', 'screen.png'].forEach(icon => {
              if (fs.existsSync(icon)) {
                this.emitFile({
                  type: 'asset',
                  fileName: icon,
                  source: fs.readFileSync(icon)
                });
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              // Keep original names for PWA assets
              if (assetInfo.name && assetInfo.name.includes('icon_')) {
                return assetInfo.name;
              }
              if (assetInfo.name && assetInfo.name.includes('manifest')) {
                return '[name][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      },
      // Copy PWA files to dist
      publicDir: false, // Disable default public dir
      copyPublicDir: false
    };
});
