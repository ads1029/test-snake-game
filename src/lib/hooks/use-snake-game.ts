'use client';

import { useCallback, useState } from 'react';
import { Direction, GameState, Position, GRID_SIZE, INITIAL_SNAKE_LENGTH, Food, FoodType, TELEPORT_FOOD_CHANCE, REVERSE_FOOD_CHANCE, MIN_DISTANCE_FROM_EDGE } from '../types';

function findSafeTeleportPosition(snake: Position[]): Position {
  let position: Position;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    position = {
      x: MIN_DISTANCE_FROM_EDGE + Math.floor(Math.random() * (GRID_SIZE - 2 * MIN_DISTANCE_FROM_EDGE)),
      y: MIN_DISTANCE_FROM_EDGE + Math.floor(Math.random() * (GRID_SIZE - 2 * MIN_DISTANCE_FROM_EDGE))
    };

    // Check if position is safe (at least 3 blocks away from snake)
    const isSafe = snake.every(segment => 
      Math.abs(segment.x - position.x) > MIN_DISTANCE_FROM_EDGE || 
      Math.abs(segment.y - position.y) > MIN_DISTANCE_FROM_EDGE
    );

    if (isSafe) return position;
    attempts++;
  } while (attempts < maxAttempts);

  // If no safe position found after max attempts, return a position that's just away from edges
  return position;
}

function createInitialSnake(): Position[] {
  // 将蛇放在网格中央偏左的位置
  const centerY = Math.floor(GRID_SIZE / 2);
  const startX = Math.floor(GRID_SIZE / 3); // 从左侧1/3处开始
  
  // 确保蛇的身体是水平排列的，头部在右侧
  return Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, i) => ({
    x: startX + i,
    y: centerY,
  }));
}

function generateFood(snake: Position[]): Food {
  // Determine food type
  const random = Math.random();
  let foodType: FoodType;
  // if (random < TELEPORT_FOOD_CHANCE) {
  //   foodType = 'teleport';
  // } else if (random < TELEPORT_FOOD_CHANCE + REVERSE_FOOD_CHANCE) {
  //   foodType = 'reverse';
  // } else {
  //   foodType = 'regular';
  // }
  foodType = "reverse"
  
  // 使用固定的种子初始化食物位置
  const initialFood: Food = {
    x: 5,
    y: 5,
    type: foodType
  };
  
  // 检查初始食物位置是否与蛇重叠
  if (!snake.some(segment => segment.x === initialFood.x && segment.y === initialFood.y)) {
    return initialFood;
  }
  
  // 如果重叠，使用原来的随机生成逻辑
  let food: Food;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      type: foodType
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
    hasStarted: false,
    isPaused: false  // Add this new state
  });

  const moveSnake = useCallback(() => {
    setGameState(prevState => {
      if (prevState.isGameOver || !prevState.hasStarted || prevState.isPaused) return prevState;
      
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
        // 修改自身碰撞检测，排除与第一节身体的碰撞
        newSnake.slice(2).some(segment => segment.x === head.x && segment.y === head.y)
      ) {
        console.log('游戏结束，碰撞检测：', {
          head,
          边界: { x: [0, GRID_SIZE-1], y: [0, GRID_SIZE-1] },
          自身碰撞: newSnake.slice(2).some(segment => segment.x === head.x && segment.y === head.y)
        });
        return { ...prevState, isGameOver: true };
      }
  
      // 添加新头部
      newSnake.unshift(head);
  
      // 检查是否吃到食物
      let newFood = prevState.food;
      let newScore = prevState.score;
  
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        if (prevState.food.type === 'teleport') {
          // Teleport the snake head
          const newHead = findSafeTeleportPosition(newSnake);
          newSnake[0] = newHead;
        } else if (prevState.food.type === 'reverse') {
          // Reverse the snake's body
          newSnake.reverse();
          
          // Calculate new direction based on the last two segments (now first two after reverse)
          const newHead = newSnake[0];
          const secondSegment = newSnake[1];
          let newDirection: Direction;
          
          if (newHead.x > secondSegment.x) newDirection = 'RIGHT';
          else if (newHead.x < secondSegment.x) newDirection = 'LEFT';
          else if (newHead.y > secondSegment.y) newDirection = 'DOWN';
          else newDirection = 'UP';
          
          // Generate new food after reversing the snake
          newFood = generateFood(newSnake);
          return {
            ...prevState,
            snake: newSnake,
            food: newFood,
            score: newScore + 1,
            direction: newDirection
          };
        }
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
  }, []);

  const changeDirection = useCallback((newDirection: Direction) => {
    setGameState(prevState => {
      // Don't start the game if it's game over
      if (prevState.isGameOver) return prevState;

      // If game hasn't started, start it with the pressed direction
      if (!prevState.hasStarted) {
        return {
          ...prevState,
          direction: newDirection,
          hasStarted: true
        };
      }

      // Prevent 180-degree turns
      const invalidMove =
        (prevState.direction === 'UP' && newDirection === 'DOWN') ||
        (prevState.direction === 'DOWN' && newDirection === 'UP') ||
        (prevState.direction === 'LEFT' && newDirection === 'RIGHT') ||
        (prevState.direction === 'RIGHT' && newDirection === 'LEFT');

      if (invalidMove) return prevState;

      return {
        ...prevState,
        direction: newDirection
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
      hasStarted: false,
      isPaused: false  // Add this property here too
    });
  }, []);

  // Add a new function to toggle pause
  const togglePause = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isPaused: !prevState.isPaused
    }));
  }, []);

  return {
    gameState,
    moveSnake,
    changeDirection,
    resetGame,
    togglePause,  // Export the new function
  };
}