import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        educationFinanciere: resolve(__dirname, 'education-financiere.html'),
        apprendreLaBourse: resolve(__dirname, 'apprendre-la-bourse.html'),
        cryptoDebutant: resolve(__dirname, 'crypto-debutant.html'),
        confidentialite: resolve(__dirname, 'politique-confidentialite.html'),
        conditions: resolve(__dirname, 'conditions-utilisation.html/index.html')
      }
    }
  }
}) 