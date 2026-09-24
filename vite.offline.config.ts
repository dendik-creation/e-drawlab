import { defineConfig, mergeConfig, type Plugin } from 'vite'
import base from './vite.config'

// Browsers block `<script type="module">` (and its `crossorigin` fetch) from a
// `file://` origin. Emit one classic IIFE bundle and rewrite the entry tags so
// index.html opens by double-click. Assets stay separate files.
const classicScript = (): Plugin => ({
  name: 'offline-classic-script',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const script = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/)
      if (!script) throw new Error('offline build: module entry script not found')
      return html
        .replace(script[0], '')
        .replace(/ crossorigin(="[^"]*")?/g, '')
        .replace('</body>', `<script defer src="${script[1]}"></script>\n  </body>`)
    },
  },
})

export default mergeConfig(
  base,
  defineConfig({
    base: './',
    experimental: {
      // Default relative URLs resolve against document.currentScript, which is
      // null once render-time code runs. JS resolves against the page instead;
      // CSS stays file-relative.
      renderBuiltUrl: (filename, { hostType }) =>
        hostType === 'js' ? { runtime: JSON.stringify(`./${filename}`) } : { relative: true },
    },
    plugins: [classicScript()],
    build: {
      outDir: 'dist-offline',
      modulePreload: false,
      cssCodeSplit: false,
      rolldownOptions: { output: { format: 'iife', codeSplitting: false } },
    },
  }),
)
