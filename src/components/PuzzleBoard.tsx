/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  GRID_SIZE,
  TOTAL_TILES,
  indexToCoord,
  coordToIndex,
  findBlankIndex,
  canDirectlyMove,
  getMovableDirection,
  slideTile,
  slideByDirection,
  isTileInHome,
  getHomeCoord,
  MoveDirection,
} from '../utils/puzzle';

interface PuzzleBoardProps {
  board: number[];
  onMove: (newBoard: number[], movedTilesCount: number) => void;
  isSolved: boolean;
  showGuides: boolean;
  tileTheme: 'slate' | 'wood' | 'ceramic' | 'indigo';
}

interface DragState {
  tileVal: number;
  tileIndex: number;
  direction: MoveDirection | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  cellSize: number;
  startTime: number;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  board,
  onMove,
  isSolved,
  showGuides,
  tileTheme,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Global board swipe detection state for non-tile or broad gestures
  const boardTouchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTileClick = useCallback(
    (index: number) => {
      if (isSolved) return;
      const res = slideTile(board, index);
      if (res) {
        onMove(res.newBoard, res.movedTilesCount);
      }
    },
    [board, isSolved, onMove]
  );

  // Handle pointer down on a specific tile
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    val: number,
    tileIndex: number
  ) => {
    if (isSolved || val === 0) return;

    // Only handle primary pointer (left mouse or single touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const cellSize = rect.width;
    const direction = getMovableDirection(board, tileIndex);

    setDragState({
      tileVal: val,
      tileIndex,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
      cellSize,
      startTime: Date.now(),
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    const rawDx = e.clientX - dragState.startX;
    const rawDy = e.clientY - dragState.startY;
    const { direction, cellSize } = dragState;

    let clampedOffsetX = 0;
    let clampedOffsetY = 0;

    if (direction === 'right') {
      clampedOffsetX = Math.max(0, Math.min(cellSize, rawDx));
    } else if (direction === 'left') {
      clampedOffsetX = Math.min(0, Math.max(-cellSize, rawDx));
    } else if (direction === 'down') {
      clampedOffsetY = Math.max(0, Math.min(cellSize, rawDy));
    } else if (direction === 'up') {
      clampedOffsetY = Math.min(0, Math.max(-cellSize, rawDy));
    } else {
      // Tile is not directly adjacent (might be in same row/col for line shift)
      // We check if line shifting applies
      const blankIdx = findBlankIndex(board);
      const clickedCoord = indexToCoord(dragState.tileIndex);
      const blankCoord = indexToCoord(blankIdx);

      if (clickedCoord.row === blankCoord.row) {
        if (clickedCoord.col < blankCoord.col) {
          clampedOffsetX = Math.max(0, Math.min(cellSize * 0.5, rawDx));
        } else {
          clampedOffsetX = Math.min(0, Math.max(-cellSize * 0.5, rawDx));
        }
      } else if (clickedCoord.col === blankCoord.col) {
        if (clickedCoord.row < blankCoord.row) {
          clampedOffsetY = Math.max(0, Math.min(cellSize * 0.5, rawDy));
        } else {
          clampedOffsetY = Math.min(0, Math.max(-cellSize * 0.5, rawDy));
        }
      }
    }

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            offsetX: clampedOffsetX,
            offsetY: clampedOffsetY,
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { tileIndex, direction, cellSize, offsetX, offsetY, startX, startY, startTime } =
      dragState;
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);
    const duration = Date.now() - startTime;
    const velocity = totalDist / Math.max(1, duration); // px per ms

    setDragState(null);

    // Case A: Pure tap / quick click
    if (totalDist < 10) {
      handleTileClick(tileIndex);
      return;
    }

    // Case B: Swiped or dragged in adjacent direction
    const threshold = cellSize * 0.28;
    const isQuickFlick = velocity > 0.4 && totalDist > 16;

    if (direction === 'right' && (offsetX > threshold || (isQuickFlick && e.clientX > startX))) {
      handleTileClick(tileIndex);
    } else if (
      direction === 'left' &&
      (offsetX < -threshold || (isQuickFlick && e.clientX < startX))
    ) {
      handleTileClick(tileIndex);
    } else if (
      direction === 'down' &&
      (offsetY > threshold || (isQuickFlick && e.clientY > startY))
    ) {
      handleTileClick(tileIndex);
    } else if (
      direction === 'up' &&
      (offsetY < -threshold || (isQuickFlick && e.clientY < startY))
    ) {
      handleTileClick(tileIndex);
    } else {
      // Check if it's a line shift gesture
      const blankIdx = findBlankIndex(board);
      const clickedCoord = indexToCoord(tileIndex);
      const blankCoord = indexToCoord(blankIdx);

      if (clickedCoord.row === blankCoord.row) {
        if (clickedCoord.col < blankCoord.col && (offsetX > 20 || (isQuickFlick && e.clientX > startX))) {
          handleTileClick(tileIndex);
        } else if (clickedCoord.col > blankCoord.col && (offsetX < -20 || (isQuickFlick && e.clientX < startX))) {
          handleTileClick(tileIndex);
        }
      } else if (clickedCoord.col === blankCoord.col) {
        if (clickedCoord.row < blankCoord.row && (offsetY > 20 || (isQuickFlick && e.clientY > startY))) {
          handleTileClick(tileIndex);
        } else if (clickedCoord.row > blankCoord.row && (offsetY < -20 || (isQuickFlick && e.clientY < startY))) {
          handleTileClick(tileIndex);
        }
      }
    }
  };

  // Keyboard controls (Arrow keys and WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolved) return;

      let dir: MoveDirection | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'up';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'down';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'left';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'right';

      if (dir) {
        e.preventDefault();
        const res = slideByDirection(board, dir);
        if (res) {
          onMove(res.newBoard, 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isSolved, onMove]);

  // Touch swipe fallback on the board container background (e.g. user swipes empty area or whole board)
  const handleBoardTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      boardTouchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleBoardTouchEnd = (e: React.TouchEvent) => {
    if (!boardTouchStart.current || dragState) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - boardTouchStart.current.x;
    const dy = touch.clientY - boardTouchStart.current.y;
    const dt = Date.now() - boardTouchStart.current.time;
    boardTouchStart.current = null;

    if (dt < 400 && (Math.abs(dx) > 35 || Math.abs(dy) > 35)) {
      let dir: MoveDirection | null = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }

      if (dir) {
        const res = slideByDirection(board, dir);
        if (res) {
          onMove(res.newBoard, 1);
        }
      }
    }
  };

  // Theme styling configurations
  const themeStyles = {
    slate: {
      tray: 'bg-stone-200/90 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 shadow-inner',
      tile: 'bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700 shadow-md shadow-stone-900/10 active:shadow-sm',
      tileInHome: 'ring-1 ring-emerald-500/30 dark:ring-emerald-400/30',
      homePip: 'bg-emerald-500',
      slot: 'bg-stone-300/40 dark:bg-stone-950/60 border border-stone-300/60 dark:border-stone-800/60',
    },
    wood: {
      tray: 'bg-amber-950/80 border-4 border-amber-900/70 shadow-2xl',
      tile: 'bg-gradient-to-b from-amber-100 via-amber-50 to-amber-200 text-amber-950 border border-amber-300 shadow-md shadow-amber-950/30 active:shadow-sm',
      tileInHome: 'ring-2 ring-amber-600/50',
      homePip: 'bg-amber-700',
      slot: 'bg-amber-950/40 border border-amber-900/50',
    },
    ceramic: {
      tray: 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner',
      tile: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
      tileInHome: 'ring-1 ring-blue-500/40',
      homePip: 'bg-blue-600',
      slot: 'bg-slate-200/50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800',
    },
    indigo: {
      tray: 'bg-indigo-950/40 dark:bg-indigo-950/70 border border-indigo-900/40 shadow-inner',
      tile: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-400/40 shadow-lg shadow-indigo-950/30 active:shadow-sm',
      tileInHome: 'ring-2 ring-emerald-400/60',
      homePip: 'bg-emerald-400',
      slot: 'bg-indigo-950/30 border border-indigo-900/30',
    },
  }[tileTheme];

  // Render static background grid slots (recessed pockets)
  const renderBackgroundSlots = () => {
    return Array.from({ length: TOTAL_TILES }).map((_, idx) => {
      const { row, col } = indexToCoord(idx);
      const targetVal = idx + 1; // 1..16 (16 is blank)
      const isBlankSlot = idx === TOTAL_TILES - 1;

      return (
        <div
          key={`slot-${idx}`}
          className={`absolute rounded-xl sm:rounded-2xl flex items-center justify-center select-none transition-colors duration-200 ${themeStyles.slot}`}
          style={{
            width: 'calc(25% - 8px)',
            height: 'calc(25% - 8px)',
            left: `calc(${col * 25}% + 4px)`,
            top: `calc(${row * 25}% + 4px)`,
          }}
        >
          {showGuides && !isBlankSlot && (
            <span className="text-xs sm:text-sm font-semibold tracking-wider opacity-25 dark:opacity-20 font-mono">
              {targetVal}
            </span>
          )}
        </div>
      );
    });
  };

  // Render active tiles (1..15) with their current absolute percentage positions
  const renderTiles = () => {
    // Array of tile numbers from 1 to 15
    const tileValues = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);

    return tileValues.map((val) => {
      const currentIndex = board.indexOf(val);
      if (currentIndex === -1) return null;

      const { row, col } = indexToCoord(currentIndex);
      const isMovable = canDirectlyMove(board, currentIndex);
      const inHome = isTileInHome(val, currentIndex);
      const isDragging = dragState?.tileVal === val;

      const translateX = isDragging ? dragState.offsetX : 0;
      const translateY = isDragging ? dragState.offsetY : 0;

      // When dragging, z-index elevates and smooth transition turns off for instant finger tracking
      const style: React.CSSProperties = {
        width: 'calc(25% - 8px)',
        height: 'calc(25% - 8px)',
        left: `calc(${col * 25}% + 4px)`,
        top: `calc(${row * 25}% + 4px)`,
        transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
        transition: isDragging
          ? 'none'
          : 'left 180ms cubic-bezier(0.2, 0.9, 0.3, 1), top 180ms cubic-bezier(0.2, 0.9, 0.3, 1), transform 140ms ease-out',
        zIndex: isDragging ? 30 : 10,
        touchAction: 'none',
      };

      return (
        <div
          key={`tile-${val}`}
          style={style}
          onPointerDown={(e) => handlePointerDown(e, val, currentIndex)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute rounded-xl sm:rounded-2xl cursor-pointer select-none flex flex-col items-center justify-center transition-shadow duration-150 ${themeStyles.tile} ${
            inHome ? themeStyles.tileInHome : ''
          } ${
            isMovable
              ? 'hover:brightness-105 active:scale-[0.98]'
              : 'opacity-95'
          }`}
          role="button"
          tabIndex={0}
          aria-label={`Tile ${val}${inHome ? ', in correct position' : ''}${
            isMovable ? ', movable' : ''
          }`}
        >
          {/* Tile number */}
          <span className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tabular-nums tracking-tight">
            {val}
          </span>

          {/* Home position indicator pip */}
          {inHome && (
            <span
              className={`absolute bottom-2 right-2.5 w-1.5 h-1.5 rounded-full ${themeStyles.homePip}`}
              title="Tile in correct spot"
            />
          )}

          {/* Movability hint dot on top right if adjacent to blank */}
          {isMovable && !inHome && (
            <span
              className="absolute top-2 right-2.5 w-1 h-1 rounded-full bg-stone-400/60 dark:bg-stone-500/60"
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto">
      {/* Outer physical tray */}
      <div
        ref={containerRef}
        onTouchStart={handleBoardTouchStart}
        onTouchEnd={handleBoardTouchEnd}
        className={`relative w-full h-full p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl ${themeStyles.tray} select-none overflow-hidden`}
        style={{ touchAction: 'none' }}
      >
        {/* Recessed slots */}
        <div className="relative w-full h-full">
          {renderBackgroundSlots()}
          {renderTiles()}
        </div>
      </div>
    </div>
  );
};
