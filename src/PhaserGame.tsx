import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { StartGame, StopGame } from './game/main'

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    gameRef.current = StartGame(containerRef.current)

    return () => {
      StopGame()
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} id="phaser-container" />
}
