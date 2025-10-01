import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020', // This was already correct
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {} // Changed from process.env to {}
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    }
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'util'
    ],
    esbuildOptions: {
      target: 'es2020', // Added this
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})