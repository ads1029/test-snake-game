export interface Position {
  x: number;
  y: number;
}

export type FoodType = 'regular' | 'teleport' | 'reverse';

export interface Food extends Position {
  type: FoodType;
}

export interface GameState {
  snake: Position[];
  food: Food;
  direction: Direction;
  isGameOver: boolean;
  score: number;
  hasStarted: boolean;
  isPaused: boolean;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 添加这些缺失的常量
export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const GAME_SPEED = 150; // 毫秒
export const INITIAL_SNAKE_LENGTH = 20;
export const TELEPORT_FOOD_CHANCE = 1/3; // 33.33% chance to spawn teleport food
export const REVERSE_FOOD_CHANCE = 1/3; // 33.33% chance to spawn reverse food
// export const REVERSE_FOOD_CHANCE = 0; // 33.33% chance to spawn reverse food
export const MIN_DISTANCE_FROM_EDGE = 5; // Minimum distance from map edges for teleportation