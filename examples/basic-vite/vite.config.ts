import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['skdb'], // TODO remove once fixed https://github.com/vitejs/vite/issues/8427
  },
})
