// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  base: '/WorkoutTrack/', // Set the base URL for GitHub Pages
  plugins: [
    react(),
    VitePWA({
      base: '/WorkoutTrack/', // Explicitly set base for PWA plugin
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Add more advanced caching strategies if needed
      },
      devOptions: {
        enabled: true // Set to false for production
      },
      manifest: {
        name: "FitNotes PWA",
        short_name: "FitNotes", // Changed for clarity
        description: "Your personal workout tracker, inspired by your awesomeness.",
        theme_color: "#4f46e5",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icons/icon-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
})