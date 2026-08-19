import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const AUDIO_EXTENSIONS = /\.(webm|ogg|m4a|mp3|wav)$/

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Small sounds would otherwise be base64-inlined into the JS bundle, which
    // hides them from the service worker's precache and charges every one of
    // them ~33% overhead against the asset budget. Audio always stays a file.
    assetsInlineLimit: (filePath) => (AUDIO_EXTENSIONS.test(filePath) ? false : undefined),
  },
})
