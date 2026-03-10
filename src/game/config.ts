import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';

/**
 * Creates and returns a Phaser game config optimized for mobile-first play.
 */
export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    backgroundColor: '#1a1a2e',
    scene: [BootScene, MenuScene, BattleScene, UIScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    input: {
      activePointers: 3,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };
}

/**
 * Bootstrap the Phaser game instance.
 */
export function launchGame(parent: string | HTMLElement): Phaser.Game {
  const config = createGameConfig(parent);
  return new Phaser.Game(config);
}
