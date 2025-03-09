'use client';

import { useEffect, useRef, useState } from 'react';
import { Position, CELL_SIZE, GRID_SIZE, GAME_SPEED } from '@/lib/types';
import { useSnakeGame } from '@/lib/hooks/use-snake-game';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GameBoard() {
  // 添加客户端渲染标志
  const [isClient, setIsClient] = useState(false);
  const { gameState, moveSnake, changeDirection, resetGame } = useSnakeGame();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default behavior to avoid conflicts with browser extensions
      e.preventDefault();
      
      // Use key codes instead of key names for better compatibility
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          changeDirection('UP');
          moveSnake();
          break;
        case 'ArrowDown':
        case 'KeyS':
          changeDirection('DOWN');
          moveSnake();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          changeDirection('LEFT');
          moveSnake();
          break;
        case 'ArrowRight':
        case 'KeyD':
          changeDirection('RIGHT');
          moveSnake();
          break;
      }
    };

    // Use a more specific event target - the document instead of window
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, moveSnake]);
  
  // Add touch controls for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Implement simple touch controls if needed
    };
    
    // Uncomment if you want to add touch controls
    // document.addEventListener('touchstart', handleTouchStart);
    // return () => document.removeEventListener('touchstart', handleTouchStart);
  }, []);


  // Removed automatic movement interval - snake only moves on key press

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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden"
           style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
        {isClient && Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            const cellContent = getCellContent({ x, y });
            return (
              <div
                key={`${x}-${y}`}
                className="absolute"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  border: '1px solid #e5e7eb',
                  backgroundColor: cellContent === 'snake' ? '#16a34a' : 
                                 cellContent === 'food' ? '#e11d48' : 'transparent',
                  boxShadow: cellContent === 'snake' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
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