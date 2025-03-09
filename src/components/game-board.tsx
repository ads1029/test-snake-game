'use client';

import { useEffect, useRef, useState } from 'react';
import { Position, CELL_SIZE, GRID_SIZE, GAME_SPEED } from '@/lib/types';
import { useSnakeGame } from '@/lib/hooks/use-snake-game';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GameBoard() {
  const [isClient, setIsClient] = useState(false);
  const { gameState, moveSnake, changeDirection, resetGame } = useSnakeGame();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || gameState.isGameOver || !gameState.hasStarted) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      moveSnake();
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isClient, gameState.isGameOver, gameState.hasStarted, moveSnake]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          changeDirection('RIGHT');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection]);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Implement simple touch controls if needed
    };
  }, []);

  useEffect(() => {
    console.log('游戏状态更新:', gameState);
  }, [gameState]);

  const getCellContent = (position: Position) => {
    if (gameState.snake.some(segment => segment.x === position.x && segment.y === position.y)) {
      return 'snake';
    }
    if (gameState.food.x === position.x && gameState.food.y === position.y) {
      return 'food';
    }
    return '';
  };

  const boardSize = GRID_SIZE * CELL_SIZE;

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        style={{ 
          width: `${boardSize}px`, 
          height: `${boardSize}px` 
        }}
        className="relative bg-gray-100 rounded-lg overflow-hidden"
      >
        {isClient && Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            const cellContent = getCellContent({ x, y });
            const positionStyle = {
              left: `${x * CELL_SIZE}px`,
              top: `${y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              position: 'absolute' as const,
              backgroundColor: cellContent === 'snake' ? 
                (gameState.snake[0].x === x && gameState.snake[0].y === y ? '#4ade80' : '#16a34a')
                : cellContent === 'food' ? '#dc2626' : 'transparent',
              boxShadow: cellContent === 'snake' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
              border: '1px solid #374151'
            };
            
            return (
              <div
                key={`${x}-${y}`}
                style={positionStyle}
              />
            );
          })
        )}
        {!isClient && <p className="text-center p-10">加载中...</p>}
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-bold">Score: {gameState.score}</p>
        {gameState.isGameOver && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-red-500 font-bold">Game Over!</p>
            <Button onClick={resetGame}>Play Again</Button>
          </div>
        )}
      </div>
    </div>
  );
}