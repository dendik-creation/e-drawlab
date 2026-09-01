import type { CSSProperties, ReactNode } from 'react'
import './primitives.css'

/**
 * Design-space layout primitives.
 *
 * Every scene in this app was authored against a 1920x1080 Figma frame, and
 * the canvas build placed things by absolute design coordinates. These keep
 * that authoring model exactly — a box still means "this many design pixels
 * at this design position" — while the browser does the layout, so a static
 * element costs nothing after its first paint.
 */

export interface BoxProps {
  /** Design-space position. With `origin="center"` this is the box's centre, matching Phaser's setOrigin(0.5). */
  x: number
  y: number
  w?: number
  h?: number
  origin?: 'topleft' | 'center'
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

function boxVars({ x, y, w, h }: Pick<BoxProps, 'x' | 'y' | 'w' | 'h'>): CSSProperties {
  return {
    '--box-x': `${x}px`,
    '--box-y': `${y}px`,
    ...(w === undefined ? {} : { '--box-w': `${w}px` }),
    ...(h === undefined ? {} : { '--box-h': `${h}px` }),
  } as CSSProperties
}

export function Box({ x, y, w, h, origin = 'topleft', className, style, children }: BoxProps) {
  return (
    <div
      className={className ? `edl-box ${className}` : 'edl-box'}
      data-origin={origin}
      style={{ ...boxVars({ x, y, w, h }), ...style }}
    >
      {children}
    </div>
  )
}

export interface ImgProps extends BoxProps {
  src: string
  alt?: string
  /** `cover` crops to fill the box (Phaser's coverFit); `contain` fits inside it. */
  fit?: 'cover' | 'contain' | 'fill'
}

export function Img({ src, alt = '', fit = 'cover', ...box }: ImgProps) {
  return (
    <Box {...box}>
      <img className={`edl-${fit}`} src={src} alt={alt} draggable={false} />
    </Box>
  )
}

export interface TextProps {
  x: number
  y: number
  children: ReactNode
  /** Design-space font size in px — the same number the canvas build passed to Phaser. */
  size: number
  family?: 'heading' | 'body' | 'mono'
  weight?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  /** Anchor within the text block. `center` matches setOrigin(0.5). */
  origin?: 'topleft' | 'center' | 'topcenter'
  /** Fixed width in design px; omit to size to content. */
  width?: number
  /** Extra leading in design px, matching Phaser's `lineSpacing`. */
  lineSpacing?: number
  className?: string
  style?: CSSProperties
}

/**
 * A block of text positioned in design space.
 *
 * Rendered as real text, not a rasterised texture: the canvas build allocated
 * a canvas and uploaded a GPU texture per string, and re-uploaded it on every
 * `setText` — which is what made the simulators' live readouts expensive.
 */
export function Text({
  x,
  y,
  children,
  size,
  family = 'body',
  weight = 500,
  color = 'var(--c-text)',
  align = 'center',
  origin = 'center',
  width,
  lineSpacing = 0,
  className,
  style,
}: TextProps) {
  return (
    <div
      className={className ? `edl-text ${className}` : 'edl-text'}
      data-origin={origin}
      data-fixed-width={width === undefined ? undefined : ''}
      style={
        {
          '--box-x': `${x}px`,
          '--box-y': `${y}px`,
          ...(width === undefined ? {} : { '--box-w': `${width}px` }),
          fontFamily: `var(--font-${family})`,
          fontSize: `${size}px`,
          fontWeight: weight,
          lineHeight: `${size * 1.25 + lineSpacing}px`,
          color,
          textAlign: align,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
