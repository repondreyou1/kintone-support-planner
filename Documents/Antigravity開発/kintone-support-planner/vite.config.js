import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/k/v1': {
        target: 'https://kojirou.cybozu.com', // ユーザーが書き換える場所
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
