import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const AUDIO_EXTENSIONS = /\.(webm|ogg|m4a|mp3|wav)$/
// WebP compresses the art down past Vite's 4 KB inline threshold, so without
// this most of the sprite sheet would end up base64'd into the entry chunk —
// paid for on first load even by players who never open that scene, and at
// ~33% size overhead. Textures always stay separately fetchable files.
const IMAGE_EXTENSIONS = /\.(webp|png|jpe?g|avif)$/

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Small sounds would otherwise be base64-inlined into the JS bundle, which
    // hides them from the service worker's precache and charges every one of
    // them ~33% overhead against the asset budget. Audio always stays a file.
    assetsInlineLimit: (filePath) =>
      AUDIO_EXTENSIONS.test(filePath) || IMAGE_EXTENSIONS.test(filePath) ? false : undefined,
  },
})
