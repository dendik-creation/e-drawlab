/**
 * The phone drawn in the "please rotate" prompts.
 *
 * One SVG shared by the splash's orientation gate and the app-level
 * `OrientationGuard`, which previously drew the same device twice — once as a
 * Phaser Graphics path, once as inline JSX. The earpiece and home indicator
 * are not decoration: without them a rotated rounded rectangle reads as an
 * abstract shape rather than a device.
 */
export default function PhoneOutline({ size = 160, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size * 0.6}
      height={size}
      viewBox="0 0 96 160"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="90" height="154" rx="18" fill="#ffffff" stroke="#2b909f" strokeWidth="6" />
      <rect x="17" y="25" width="62" height="112" rx="8" fill="#dff0f2" />
      <rect x="35" y="10" width="26" height="5" rx="2.5" fill="#2b909f" />
      <rect x="35" y="145" width="26" height="5" rx="2.5" fill="#2b909f" />
    </svg>
  )
}
