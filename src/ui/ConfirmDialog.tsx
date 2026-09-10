import { useEffect, useState } from 'react'
import Pressable from './Pressable'
import './confirmDialog.css'

/**
 * A modal yes/no prompt — today just "Keluar?" on Home, but generic enough
 * for the next confirm the app needs. Stays mounted through its own exit
 * animation: `open` flips to `false` immediately, but the backdrop and card
 * keep rendering (playing the reverse animation) until it ends.
 */
export interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={open ? 'edl-dialog-backdrop' : 'edl-dialog-backdrop is-closing'}
      onAnimationEnd={(event) => {
        if (!open && event.target === event.currentTarget) setMounted(false)
      }}
    >
      <div
        className={open ? 'edl-dialog' : 'edl-dialog is-closing'}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="edl-dialog-title"
        aria-describedby={message ? 'edl-dialog-message' : undefined}
      >
        <h2 id="edl-dialog-title" className="edl-dialog-title">
          {title}
        </h2>
        {message && (
          <p id="edl-dialog-message" className="edl-dialog-message">
            {message}
          </p>
        )}
        <div className="edl-dialog-actions">
          <Pressable className="edl-dialog-btn is-cancel" onPress={onCancel}>
            <span>{cancelLabel}</span>
          </Pressable>
          <Pressable className="edl-dialog-btn is-confirm" onPress={onConfirm}>
            <span>{confirmLabel}</span>
          </Pressable>
        </div>
      </div>
    </div>
  )
}
