export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  isGameOver: boolean;
  score: number;
  hasStarted: boolean;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 添加这些缺失的常量
export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const GAME_SPEED = 150; // 毫秒
export const INITIAL_SNAKE_LENGTH = 3;