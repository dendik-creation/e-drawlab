import Phaser from 'phaser'

/**
 * Scales and crops an image to fill a target box without distorting its
 * aspect ratio (like CSS object-fit: cover). `focusY` picks which edge stays
 * uncropped when the box is wider than the image (0 = keep the top, 1 = keep
 * the bottom, 0.5 = crop evenly from both — the default, matching the old
 * always-centered behaviour every other caller still relies on).
 */
export function coverFit(
  image: Phaser.GameObjects.Image,
  width: number,
  height: number,
  focusY = 0.5,
) {
  const texWidth = image.width
  const texHeight = image.height
  const scale = Math.max(width / texWidth, height / texHeight)
  const cropWidth = width / scale
  const cropHeight = height / scale

  return image
    .setCrop(
      (texWidth - cropWidth) / 2,
      (texHeight - cropHeight) * focusY,
      cropWidth,
      cropHeight,
    )
    .setScale(scale)
}

/** Scales an image to fit within a target box without cropping it (like CSS object-fit: contain). */
export function containFit(
  image: Phaser.GameObjects.Image,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.width, height / image.height)
  return image.setScale(scale)
}
