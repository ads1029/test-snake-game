'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Position, CELL_SIZE, GRID_SIZE, GAME_SPEED } from '@/lib/types';
import { useSnakeGame } from '@/lib/hooks/use-snake-game';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  opacity: number;
  color: string;
}

export function GameBoard() {
  const [isClient, setIsClient] = useState(false);
  const { gameState, moveSnake, changeDirection, resetGame } = useSnakeGame();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

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

    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isClient, gameState.isGameOver, gameState.hasStarted, moveSnake]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (gameState.isGameOver && e.code === 'Enter') {
        resetGame();
        return;
      }
      
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
  }, [changeDirection, resetGame, gameState.isGameOver]);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Implement simple touch controls if needed
    };
  }, []);

  const prevFoodRef = useRef(gameState.food);

  useEffect(() => {
    if (gameState.food !== prevFoodRef.current) {
      // Food position changed, meaning the snake ate the food
      createExplosion(prevFoodRef.current.x, prevFoodRef.current.y);
      prevFoodRef.current = gameState.food;
    }
  }, [gameState.food]);

  const createExplosion = (x: number, y: number) => {
    const isTeleportFood = gameState.food.type === 'teleport';
    const numParticles = 4 + Math.floor(Math.random() * 2); // 4-5 particles
    const newParticles: Particle[] = [];

    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles + Math.random() * 0.5;
      const speed = 2 + Math.random() * 2;
      
      newParticles.push({
        id: particleIdRef.current++,
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        opacity: 1,
        color: isTeleportFood ? '#fbbf24' : '#dc2626' // Yellow for teleport food, red for regular food
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Animate particles
    const animateParticles = () => {
      setParticles(prev =>
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          opacity: particle.opacity - 0.05
        })).filter(particle => particle.opacity > 0)
      );
    };

    const animationInterval = setInterval(animateParticles, 16);
    setTimeout(() => {
      clearInterval(animationInterval);
      setParticles([]);
    }, 1000);
  };

  useEffect(() => {
    console.log('游戏状态更新:', gameState);
  }, [gameState]);

  const getCellContent = (position: Position) => {
    if (gameState.snake.some(segment => segment.x === position.x && segment.y === position.y)) {
      return 'snake';
    }
    if (gameState.food.x === position.x && gameState.food.y === position.y) {
      if (gameState.food.type === 'teleport') return 'teleport-food';
      if (gameState.food.type === 'reverse') return 'reverse-food';
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
                : cellContent === 'food' ? '#dc2626' 
                : cellContent === 'teleport-food' ? '#fbbf24' 
                : cellContent === 'reverse-food' ? '#3b82f6' 
                : 'transparent',
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
        
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ scale: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: particle.opacity,
                scale: particle.opacity
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.016, ease: "linear" }}
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                backgroundColor: particle.color,
                borderRadius: '50%',
                pointerEvents: 'none'
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-bold">Score: {gameState.score}</p>
        {isClient && !gameState.hasStarted && !gameState.isGameOver && (
          <div className=" items-center justify-center bg-black bg-opacity-50 text-white">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p className="text-xl font-bold mb-2">准备开始</p>
              <p>按方向键开始游戏</p>
            </div>
          </div>
        )}
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