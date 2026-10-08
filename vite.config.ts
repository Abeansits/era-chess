import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/era-chess/',
  plugins: [react(), tailwindcss()],
  server: { port: 4179, host: '127.0.0.1', strictPort: true },
  preview: { port: 4179, host: '127.0.0.1', strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
