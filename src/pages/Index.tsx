import { useEffect, useRef } from 'react';
import { launchGame } from '@/game/config';
import type Phaser from 'phaser';

/**
 * GamePage: React wrapper that mounts the Phaser game into a full-viewport container.
 */
const GamePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = launchGame(containerRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-background">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default GamePage;
