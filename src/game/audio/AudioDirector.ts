/**
 * Transitional re-export: the audio director no longer runs on Phaser's sound
 * manager (see `src/audio/director.ts`). Scene modules still importing from
 * here keep working until they are migrated; delete this file with the last
 * one.
 */
export { audio } from '../../audio/director'
