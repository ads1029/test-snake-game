'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Position, CELL_SIZE, GRID_SIZE, GAME_SPEED } from '@/lib/types';
import { useSnakeGame } from '@/lib/hooks/use-snake-game';
import { Button } from '@/components/ui/button';
import { Analytics } from "@vercel/analytics/react"

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
  const prevFoodRef = useRef(gameState.food);
  const [teleportIndicator, setTeleportIndicator] = useState<Position | null>(null);
  const [teleportMoveCount, setTeleportMoveCount] = useState<number>(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);
  const directionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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
      // Allow browser refresh shortcuts (Command/Control + R)
      if (e.metaKey || e.ctrlKey) {
        return;
      }
      
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
    if (gameState.food !== prevFoodRef.current) {
      // Create particles for all food types
      const numParticles = Math.floor(Math.random() * 9) + 1; // Random number between 1-10
      const particleColor = prevFoodRef.current.type === 'teleport' ? '#fbbf24' :
                          prevFoodRef.current.type === 'reverse' ? '#3b82f6' :
                          '#dc2626';
      
      const newParticles: Particle[] = [];
      const baseX = prevFoodRef.current.x * CELL_SIZE + CELL_SIZE / 2;
      const baseY = prevFoodRef.current.y * CELL_SIZE + CELL_SIZE / 2;
      
      for (let i = 0; i < numParticles; i++) {
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDistance = Math.random() * 10;
        const randomSpeed = 3 + Math.random() * 4; // Random speed between 3-7
        
        newParticles.push({
          id: particleIdRef.current++,
          x: baseX + Math.cos(randomAngle) * randomDistance,
          y: baseY + Math.sin(randomAngle) * randomDistance,
          velocityX: Math.cos(randomAngle) * randomSpeed,
          velocityY: Math.sin(randomAngle) * randomSpeed,
          opacity: 1,
          color: particleColor
        })
      }
      setParticles(newParticles);

      // Animate particles
      const animateParticles = () => {
        setParticles(currentParticles => 
          currentParticles
            .map(p => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              opacity: p.opacity - 0.02
            }))
            .filter(p => p.opacity > 0)
        );
      };

      const animationInterval = setInterval(animateParticles, 16);
      setTimeout(() => {
        clearInterval(animationInterval);
        setParticles([]);
      }, 1000);

      if (prevFoodRef.current.type === 'teleport') {
        setTeleportIndicator(prevFoodRef.current);
        setTeleportMoveCount(0);
      }
      prevFoodRef.current = gameState.food;
    }

    // Clear teleport indicator after snake moves its current length number of times
    if (teleportIndicator) {
      setTeleportMoveCount(prev => {
        const nextCount = prev + 1;
        if (nextCount >= gameState.snake.length) {
          setTeleportIndicator(null);
          return 0;
        }
        return nextCount;
      });
    }
  }, [gameState.food, gameState.snake]);

  // Handle pan gestures with Framer Motion
  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Minimum swipe distance to trigger direction change
    const minSwipeDistance = 10;
    
    // Get the offset and velocity
    const { offset, velocity } = info;
    
    // Only process if we've moved enough distance or with enough velocity
    if (Math.abs(offset.x) < minSwipeDistance && 
        Math.abs(offset.y) < minSwipeDistance && 
        Math.abs(velocity.x) < 0.5 && 
        Math.abs(velocity.y) < 0.5) {
      return;
    }
    
    // Determine new direction
    let newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      newDirection = offset.x > 0 ? 'RIGHT' : 'LEFT';
    } else {
      // Vertical swipe
      newDirection = offset.y > 0 ? 'DOWN' : 'UP';
    }
    
    // Prevent the same direction from being triggered multiple times in quick succession
    if (newDirection !== lastDirection) {
      // Clear any existing debounce timer
      if (directionDebounceRef.current) {
        clearTimeout(directionDebounceRef.current);
      }
      
      // Set the new direction
      setLastDirection(newDirection);
      changeDirection(newDirection);
      
      // Debounce to prevent too many direction changes
      directionDebounceRef.current = setTimeout(() => {
        setLastDirection(null);
      }, 100);
    }
  };

  const getCellContent = (position: Position) => {
    if (teleportIndicator && teleportIndicator.x === position.x && teleportIndicator.y === position.y) {
      return 'teleport-indicator';
    }
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
  const teleportOpacity = teleportIndicator ? Math.max(0.2, 1 - (teleportMoveCount / gameState.snake.length)) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        ref={boardRef}
        style={{ 
          width: `${boardSize}px`, 
          height: `${boardSize}px`,
          touchAction: 'none' // Prevent browser handling of touch gestures
        }}
        className="relative bg-gray-100 rounded-lg overflow-hidden"
        onPan={handlePan}
        whileTap={{ cursor: 'grabbing' }}
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
                : cellContent === 'teleport-indicator' ? '#fef011'
                : cellContent === 'reverse-food' ? '#3b82f6' 
                : 'transparent',
              boxShadow: cellContent === 'snake' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
              border: '1px solid #374151',
              transition: cellContent === 'teleport-indicator' ? 'opacity 0.3s' : 'none',
              opacity: cellContent === 'teleport-indicator' ? teleportOpacity : 1
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
        <Analytics />
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
      </motion.div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-bold">Score: {gameState.score}</p>
        {isClient && !gameState.hasStarted && !gameState.isGameOver && (
          <div className="items-center justify-center bg-black bg-opacity-50 text-white">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="mb-4 space-y-2 text-sm">
                <p>🍎 红色普通食物 </p>
                <p>🌟 黄色传送食物 </p>
                <p>🔄 蓝色反向食物 </p>
              </div>
              <p className="text-xl font-bold mb-2">准备开始</p>
              <p>按方向键开始游戏</p>
              <p className="mt-2 text-sm">或在屏幕上滑动控制方向</p>
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