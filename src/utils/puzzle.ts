/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GRID_SIZE = 4;
export const TOTAL_TILES = 16; // 15 numbered tiles + 1 blank (0)

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  moves: number;
  description: string;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easy', label: 'Casual', moves: 20, description: '20 scramble steps · Ideal for warm-up' },
  { id: 'medium', label: 'Classic', moves: 65, description: '65 scramble steps · Balanced challenge' },
  { id: 'hard', label: 'Master', moves: 160, description: '160 scramble steps · Full puzzle depth' },
];

/**
 * Returns true if the board is in the winning solved state:
 * [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]
 */
export function isSolved(board: number[]): boolean {
  for (let i = 0; i < TOTAL_TILES - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[TOTAL_TILES - 1] === 0;
}

/**
 * Creates a solved board
 */
export function createSolvedBoard(): number[] {
  const board = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);
  board.push(0);
  return board;
}

/**
 * Find index of blank tile (0)
 */
export function findBlankIndex(board: number[]): number {
  return board.indexOf(0);
}

/**
 * Convert 1D index to { row, col }
 */
export function indexToCoord(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

/**
 * Convert { row, col } to 1D index
 */
export function coordToIndex(row: number, col: number): number {
  return row * GRID_SIZE + col;
}

/**
 * Get the target home { row, col } for a given tile value (1..15)
 */
export function getHomeCoord(val: number): { row: number; col: number } {
  if (val === 0) return { row: GRID_SIZE - 1, col: GRID_SIZE - 1 };
  const targetIndex = val - 1;
  return indexToCoord(targetIndex);
}

/**
 * Check if tile is in its home position
 */
export function isTileInHome(val: number, currentIndex: number): boolean {
  if (val === 0) return currentIndex === TOTAL_TILES - 1;
  return val === currentIndex + 1;
}

/**
 * Get all neighbor indices of a given index (up, down, left, right)
 */
export function getNeighbors(index: number): number[] {
  const { row, col } = indexToCoord(index);
  const neighbors: number[] = [];

  if (row > 0) neighbors.push(coordToIndex(row - 1, col)); // Up
  if (row < GRID_SIZE - 1) neighbors.push(coordToIndex(row + 1, col)); // Down
  if (col > 0) neighbors.push(coordToIndex(row, col - 1)); // Left
  if (col < GRID_SIZE - 1) neighbors.push(coordToIndex(row, col + 1)); // Right

  return neighbors;
}

/**
 * Check if a tile can move directly into the blank space
 */
export function canDirectlyMove(board: number[], tileIndex: number): boolean {
  if (board[tileIndex] === 0) return false;
  const blankIdx = findBlankIndex(board);
  return getNeighbors(blankIdx).includes(tileIndex);
}

/**
 * Check which direction a directly movable tile would move to reach the blank.
 * Returns null if not directly adjacent.
 */
export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export function getMovableDirection(
  board: number[],
  tileIndex: number
): MoveDirection | null {
  const blankIdx = findBlankIndex(board);
  const tileCoord = indexToCoord(tileIndex);
  const blankCoord = indexToCoord(blankIdx);

  if (tileCoord.row === blankCoord.row) {
    if (tileCoord.col + 1 === blankCoord.col) return 'right';
    if (tileCoord.col - 1 === blankCoord.col) return 'left';
  } else if (tileCoord.col === blankCoord.col) {
    if (tileCoord.row + 1 === blankCoord.row) return 'down';
    if (tileCoord.row - 1 === blankCoord.row) return 'up';
  }

  return null;
}

/**
 * Move a tile or a line of tiles towards the blank space.
 * If tile is in the same row or column as the blank, all tiles between them shift towards the blank!
 */
export function slideTile(
  board: number[],
  clickedIndex: number
): { newBoard: number[]; movedTilesCount: number } | null {
  if (board[clickedIndex] === 0) return null;

  const blankIdx = findBlankIndex(board);
  const clickedCoord = indexToCoord(clickedIndex);
  const blankCoord = indexToCoord(blankIdx);

  const newBoard = [...board];

  // Case 1: Same row
  if (clickedCoord.row === blankCoord.row) {
    const row = clickedCoord.row;
    if (clickedCoord.col < blankCoord.col) {
      // Shift right: from blank down to clickedIndex
      for (let c = blankCoord.col; c > clickedCoord.col; c--) {
        newBoard[coordToIndex(row, c)] = newBoard[coordToIndex(row, c - 1)];
      }
      newBoard[coordToIndex(row, clickedCoord.col)] = 0;
      return { newBoard, movedTilesCount: blankCoord.col - clickedCoord.col };
    } else {
      // Shift left: from blank up to clickedIndex
      for (let c = blankCoord.col; c < clickedCoord.col; c++) {
        newBoard[coordToIndex(row, c)] = newBoard[coordToIndex(row, c + 1)];
      }
      newBoard[coordToIndex(row, clickedCoord.col)] = 0;
      return { newBoard, movedTilesCount: clickedCoord.col - blankCoord.col };
    }
  }

  // Case 2: Same column
  if (clickedCoord.col === blankCoord.col) {
    const col = clickedCoord.col;
    if (clickedCoord.row < blankCoord.row) {
      // Shift down: from blank down to clickedIndex
      for (let r = blankCoord.row; r > clickedCoord.row; r--) {
        newBoard[coordToIndex(r, col)] = newBoard[coordToIndex(r - 1, col)];
      }
      newBoard[coordToIndex(clickedCoord.row, col)] = 0;
      return { newBoard, movedTilesCount: blankCoord.row - clickedCoord.row };
    } else {
      // Shift up: from blank up to clickedIndex
      for (let r = blankCoord.row; r < clickedCoord.row; r++) {
        newBoard[coordToIndex(r, col)] = newBoard[coordToIndex(r + 1, col)];
      }
      newBoard[coordToIndex(clickedCoord.row, col)] = 0;
      return { newBoard, movedTilesCount: clickedCoord.row - blankCoord.row };
    }
  }

  return null;
}

/**
 * Slide the tile that is in a given direction relative to the blank.
 * e.g. direction = 'up' means slide the tile BELOW the blank upwards into the blank.
 */
export function slideByDirection(
  board: number[],
  direction: MoveDirection
): { newBoard: number[]; movedTileVal: number } | null {
  const blankIdx = findBlankIndex(board);
  const { row, col } = indexToCoord(blankIdx);

  let targetIndex = -1;
  if (direction === 'up' && row < GRID_SIZE - 1) {
    // Tile below blank moves up
    targetIndex = coordToIndex(row + 1, col);
  } else if (direction === 'down' && row > 0) {
    // Tile above blank moves down
    targetIndex = coordToIndex(row - 1, col);
  } else if (direction === 'left' && col < GRID_SIZE - 1) {
    // Tile to right of blank moves left
    targetIndex = coordToIndex(row, col + 1);
  } else if (direction === 'right' && col > 0) {
    // Tile to left of blank moves right
    targetIndex = coordToIndex(row, col - 1);
  }

  if (targetIndex !== -1) {
    const movedTileVal = board[targetIndex];
    const res = slideTile(board, targetIndex);
    if (res) return { newBoard: res.newBoard, movedTileVal };
  }

  return null;
}

/**
 * Generate a guaranteed solvable puzzle by performing random walks from the solved state.
 * This guarantees 100% solvability and allows controlling difficulty cleanly.
 */
export function generateSolvableBoard(difficulty: Difficulty): number[] {
  const config = DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[1];
  let board = createSolvedBoard();
  let prevBlankIndex = -1;

  for (let step = 0; step < config.moves; step++) {
    const blankIdx = findBlankIndex(board);
    const neighbors = getNeighbors(blankIdx).filter((n) => n !== prevBlankIndex);
    const chosenTileIndex = neighbors[Math.floor(Math.random() * neighbors.length)];

    prevBlankIndex = blankIdx;
    const res = slideTile(board, chosenTileIndex);
    if (res) board = res.newBoard;
  }

  // Ensure we didn't accidentally end up solved
  if (isSolved(board)) {
    // Make 2 random moves
    const blankIdx = findBlankIndex(board);
    const neighbors = getNeighbors(blankIdx);
    const res1 = slideTile(board, neighbors[0]);
    if (res1) board = res1.newBoard;
  }

  return board;
}

/**
 * Calculate Manhattan distance from target configuration.
 * Useful for calculating puzzle completion percentage.
 */
export function calculateManhattanDistance(board: number[]): number {
  let distance = 0;
  for (let i = 0; i < TOTAL_TILES; i++) {
    const val = board[i];
    if (val === 0) continue;
    const currentCoord = indexToCoord(i);
    const homeCoord = getHomeCoord(val);
    distance +=
      Math.abs(currentCoord.row - homeCoord.row) +
      Math.abs(currentCoord.col - homeCoord.col);
  }
  return distance;
}

/**
 * Count how many numbered tiles are currently in their exact home positions
 */
export function countCorrectTiles(board: number[]): number {
  let count = 0;
  for (let i = 0; i < TOTAL_TILES - 1; i++) {
    if (board[i] === i + 1) count++;
  }
  return count;
}
