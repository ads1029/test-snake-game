import { GameBoard } from '@/components/game-board';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Snake Game</h1>
      <GameBoard />
      <div className="mt-8 text-center text-gray-600">
        <p>Use arrow keys to control the snake</p>
        <p>Collect food to grow and increase your score</p>
      </div>
    </main>
  );
}
