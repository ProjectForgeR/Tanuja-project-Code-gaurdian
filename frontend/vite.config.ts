import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['codeguardian.ai', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Faster proxy — keep connections alive
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[proxy error]', err.message)
          })
        },
      },
    },
    // Faster HMR
    hmr: { overlay: false },
  },
  build: {
    // Increase chunk size limit warning to suppress noise
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split Monaco editor and React into separate chunks for faster initial load
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'monaco': ['@monaco-editor/react'],
          'icons': ['lucide-react'],
          'charts': ['recharts'],
        },
      },
    },
    // Faster CSS processing
    cssMinify: true,
    minify: 'esbuild',
    target: 'es2020',
  },
  // Optimize deps pre-bundling for faster startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@monaco-editor/react',
      'recharts',
    ],
    exclude: [],
  },
})
