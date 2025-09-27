import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // Include specific polyfills needed for Self Protocol
      include: ['buffer', 'process', 'util', 'crypto'],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
    // Fix for process.env
    'process.env': process.env
  },
  resolve: {
    alias: {
      // Add Node.js polyfills
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
    ]
  }
})