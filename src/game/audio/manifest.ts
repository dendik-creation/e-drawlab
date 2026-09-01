/**
 * Transitional re-export: the audio register now lives outside `game/`, since
 * it is no longer tied to Phaser. Scene modules still importing from here
 * keep working until they are migrated; delete this file with the last one.
 */
export * from '../../audio/manifest'
