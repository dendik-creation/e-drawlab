/**
 * Image preloading for the splash progress bar.
 *
 * The canvas build got this from Phaser's loader. Here it is `Image.decode()`,
 * which is strictly better for a DOM renderer: the bitmap is decoded off the
 * main thread and lands in the browser's cache, so the scene that needs it
 * paints without the decode hitch a plain `<img>` would take on first display.
 */
export async function preloadImages(urls: string[], onProgress?: (progress: number) => void): Promise<void> {
  let done = 0

  await Promise.all(
    urls.map(async (url) => {
      try {
        const image = new Image()
        image.src = url
        await image.decode()
      } catch {
        // A decode failure must not strand the loading screen; the element
        // that draws this asset will simply retry when it mounts.
      }
      done += 1
      onProgress?.(done / urls.length)
    }),
  )
}
