import Phaser from 'phaser'

/** Scales and crops an image to fill a target box without distorting its aspect ratio (like CSS object-fit: cover). */
export function coverFit(
  image: Phaser.GameObjects.Image,
  width: number,
  height: number,
) {
  const texWidth = image.width
  const texHeight = image.height
  const scale = Math.max(width / texWidth, height / texHeight)
  const cropWidth = width / scale
  const cropHeight = height / scale

  return image
    .setCrop(
      (texWidth - cropWidth) / 2,
      (texHeight - cropHeight) / 2,
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
