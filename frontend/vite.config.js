// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    // Escucha en todas las interfaces para ser accesible desde la red local
    host: '0.0.0.0' 
  }
})