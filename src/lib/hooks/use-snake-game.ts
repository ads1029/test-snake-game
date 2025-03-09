'use client';

import { useCallback, useState } from 'react';
import { Direction, GameState, Position, GRID_SIZE, INITIAL_SNAKE_LENGTH } from '../types';

function createInitialSnake(): Position[] {
  const centerY = Math.floor(GRID_SIZE / 2);
  const centerX = Math.floor(GRID_SIZE / 2);
  return Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, i) => ({
    x: centerX - Math.floor(INITIAL_SNAKE_LENGTH / 2) + i,
    y: centerY,
  }));
}

function generateFood(snake: Position[]): Position {
  // 使用固定的种子初始化食物位置
  const initialFood = {
    x: 5,
    y: 5
  };
  
  // 检查初始食物位置是否与蛇重叠
  if (!snake.some(segment => segment.x === initialFood.x && segment.y === initialFood.y)) {
    return initialFood;
  }
  
  // 如果重叠，使用原来的随机生成逻辑
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  return food;
}

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snake: createInitialSnake(),
    food: generateFood(createInitialSnake()),
    direction: 'RIGHT',
    isGameOver: false,
    score: 0,
    hasStarted: false
  });

  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || !gameState.hasStarted) return;

    setGameState(prevState => {
      // Check if snake array is empty
      if (!prevState.snake || prevState.snake.length === 0) {
        console.error('Snake array is empty or undefined');
        return prevState;
      }
      
      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };
  
      // 更新头部位置
      switch (prevState.direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }
  
      // 检查碰撞
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE ||
        newSnake.some(segment => segment.x === head.x && segment.y === head.y)
      ) {
        console.log('游戏结束，碰撞检测：', {
          head,
          边界: { x: [0, GRID_SIZE-1], y: [0, GRID_SIZE-1] },
          自身碰撞: newSnake.some(segment => segment.x === head.x && segment.y === head.y)
        });
        return { ...prevState, isGameOver: true };
      }
  
      // 添加新头部
      newSnake.unshift(head);
  
      // 检查是否吃到食物
      let newFood = prevState.food;
      let newScore = prevState.score;
  
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        newFood = generateFood(newSnake);
        newScore += 1;
        console.log('吃到食物！新食物位置:', newFood);
      } else {
        newSnake.pop();
      }
  
      console.log('蛇的新位置:', newSnake);
  
      return {
        ...prevState,
        snake: newSnake,
        food: newFood,
        score: newScore,
      };
    });
  }, [gameState.isGameOver, gameState.hasStarted]);

  const changeDirection = useCallback((newDirection: Direction) => {
    setGameState(prevState => {
      // Don't start the game if it's game over
      if (prevState.isGameOver) return prevState;

      // Prevent 180-degree turns
      const invalidMove =
        (prevState.direction === 'UP' && newDirection === 'DOWN') ||
        (prevState.direction === 'DOWN' && newDirection === 'UP') ||
        (prevState.direction === 'LEFT' && newDirection === 'RIGHT') ||
        (prevState.direction === 'RIGHT' && newDirection === 'LEFT');

      if (invalidMove) return prevState;

      return {
        ...prevState,
        direction: newDirection,
        hasStarted: true
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      snake: createInitialSnake(),
      food: generateFood(createInitialSnake()),
      direction: 'RIGHT',
      isGameOver: false,
      score: 0,
      hasStarted: false
    });
  }, []);

  return {
    gameState,
    moveSnake,
    changeDirection,
    resetGame,
  };
}