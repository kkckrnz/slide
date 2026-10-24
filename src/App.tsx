/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  HelpCircle,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  Trophy,
  Check,
} from 'lucide-react';
import {
  Difficulty,
  DIFFICULTIES,
  generateSolvableBoard,
  isSolved,
  countCorrectTiles,
  TOTAL_TILES,
} from './utils/puzzle';
import { soundManager } from './utils/audio';
import { PuzzleBoard } from './components/PuzzleBoard';
import { VictoryModal } from './components/VictoryModal';
import { InstructionModal } from './components/InstructionModal';
import { ConfettiCanvas } from './components/ConfettiCanvas';

type Theme = 'slate' | 'wood' | 'ceramic' | 'indigo';

interface BestScore {
  time: number;
  moves: number;
}

const STORAGE_KEYS = {
  BEST_SCORES: 'slide15_best_scores_v1',
  THEME: 'slide15_theme_v1',
  DIFFICULTY: 'slide15_difficulty_v1',
  SOUND: 'slide15_sound_v1',
};

export default function App() {
  // Game settings state
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIFFICULTY);
      if (saved === 'easy' || saved === 'medium' || saved === 'hard') return saved;
    } catch {
      // ignore
    }
    return 'medium';
  });

  const [tileTheme, setTileTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'slate' || saved === 'wood' || saved === 'ceramic' || saved === 'indigo') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'slate';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);

  // Puzzle state
  const [board, setBoard] = useState<number[]>(() => generateSolvableBoard('medium'));
  const [history, setHistory] = useState<number[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<{ time: boolean; moves: boolean }>({
    time: false,
    moves: false,
  });

  // Best scores map
  const [bestScores, setBestScores] = useState<Record<Difficulty, BestScore | null>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BEST_SCORES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { easy: null, medium: null, hard: null };
  });

  // Sync sound manager
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Save theme
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, tileTheme);
    } catch {
      // ignore
    }
  }, [tileTheme]);

  // Save difficulty
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty);
    } catch {
      // ignore
    }
  }, [difficulty]);

  // Timer interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning && !isPuzzleSolved) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isPuzzleSolved]);

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start new game
  const handleNewGame = useCallback(
    (newDiff: Difficulty = difficulty) => {
      soundManager.playShuffle();
      const newBoard = generateSolvableBoard(newDiff);
      setBoard(newBoard);
      setHistory([]);
      setMoves(0);
      setTimeSeconds(0);
      setIsTimerRunning(false);
      setIsPuzzleSolved(false);
      setShowConfetti(false);
      setIsNewRecord({ time: false, moves: false });
    },
    [difficulty]
  );

  // Change difficulty
  const handleSelectDifficulty = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    handleNewGame(newDiff);
  };

  // Handle tile slide
  const handleMove = useCallback(
    (newBoard: number[], movedTilesCount: number) => {
      if (isPuzzleSolved) return;

      // Start timer on first move
      if (!isTimerRunning && moves === 0) {
        setIsTimerRunning(true);
      }

      // Check if newly placed tiles hit home positions
      const previousCorrect = countCorrectTiles(board);
      const newCorrect = countCorrectTiles(newBoard);

      if (newCorrect > previousCorrect) {
        soundManager.playHomeSnap();
      } else {
        soundManager.playSlide();
      }

      setHistory((prev) => [...prev, board]);
      setBoard(newBoard);
      setMoves((prev) => prev + movedTilesCount);

      // Check victory
      if (isSolved(newBoard)) {
        setIsTimerRunning(false);
        setIsPuzzleSolved(true);
        setShowConfetti(true);
        soundManager.playVictory();

        // Check best scores
        const currentBest = bestScores[difficulty];
        const newTime = timeSeconds + 1; // current elapsed
        const newMovesCount = moves + movedTilesCount;

        const isBestTime = !currentBest || newTime < currentBest.time;
        const isBestMoves = !currentBest || newMovesCount < currentBest.moves;

        setIsNewRecord({ time: isBestTime, moves: isBestMoves });

        const updatedScore: BestScore = {
          time: isBestTime ? newTime : currentBest.time,
          moves: isBestMoves ? newMovesCount : currentBest.moves,
        };

        const updatedMap = {
          ...bestScores,
          [difficulty]: updatedScore,
        };

        setBestScores(updatedMap);
        try {
          localStorage.setItem(STORAGE_KEYS.BEST_SCORES, JSON.stringify(updatedMap));
        } catch {
          // ignore
        }
      }
    },
    [board, difficulty, bestScores, isPuzzleSolved, isTimerRunning, moves, timeSeconds]
  );

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isPuzzleSolved) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setBoard(previous);
    setMoves((prev) => Math.max(0, prev - 1));
    soundManager.playSlide();
  };

  const correctCount = countCorrectTiles(board);
  const currentBest = bestScores[difficulty];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between selection:bg-stone-300">
      {/* Confetti celebration layer */}
      <ConfettiCanvas active={showConfetti} />

      {/* Top Bar Contract: 3 Zones */}
      <header className="w-full border-b border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0">
              Slide15
            </span>
          </div>

          {/* Zone 2: Single-line unboxed stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 font-medium tabular-nums whitespace-nowrap">
            <span>
              Time <strong className="text-stone-900 dark:text-stone-200">{formatTime(timeSeconds)}</strong>
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>
              Moves <strong className="text-stone-900 dark:text-stone-200">{moves}</strong>
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>
              Solved <strong className="text-stone-900 dark:text-stone-200">{correctCount}/15</strong>
            </span>
            {currentBest && (
              <>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Best {currentBest.moves} moves ({formatTime(currentBest.time)})</span>
                </span>
              </>
            )}
          </div>

          {/* Zone 3: Primary action & utilities */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
            </button>

            <button
              onClick={() => setShowThemePicker((prev) => !prev)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer relative"
              aria-label="Change tile theme"
              title="Tile Themes"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowInstructions(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Help and instructions"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleNewGame(difficulty)}
              className="ml-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scramble</span>
            </button>
          </div>
        </div>
      </header>

      {/* Theme selection floating popover */}
      {showThemePicker && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full relative z-30">
          <div className="absolute right-4 top-2 p-3 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col gap-2 w-48 animate-fade-in">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
              Tile Appearance
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'slate', label: 'Stone' },
                  { id: 'wood', label: 'Walnut' },
                  { id: 'ceramic', label: 'Ceramic' },
                  { id: 'indigo', label: 'Indigo' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTileTheme(t.id);
                    setShowThemePicker(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    tileTheme === t.id
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span>{t.label}</span>
                  {tileTheme === t.id && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-3 sm:py-6 flex flex-col justify-center items-center gap-3 sm:gap-4">
        {/* Mobile Stat Bar (Visible on smaller screens) */}
        <div className="sm:hidden w-full flex items-center justify-between px-2 py-1.5 rounded-xl bg-stone-200/50 dark:bg-stone-900/60 text-xs tabular-nums text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Time</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{formatTime(timeSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Moves</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{moves}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Solved</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{correctCount}/15</span>
          </div>
        </div>

        {/* Difficulty segmented switch */}
        <div className="w-full flex items-center justify-between gap-2">
          <div className="inline-flex p-1 bg-stone-200/70 dark:bg-stone-900 rounded-xl border border-stone-300/40 dark:border-stone-800/80">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDifficulty(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  difficulty === d.id
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Quick toggle for ghost target numbers */}
          <button
            onClick={() => setShowGuides((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showGuides
                ? 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Toggle ghost numbers in background slots"
          >
            {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Guides</span>
          </button>
        </div>

        {/* The 4x4 Puzzle Grid Board */}
        <div className="w-full flex items-center justify-center py-1">
          <PuzzleBoard
            board={board}
            onMove={handleMove}
            isSolved={isPuzzleSolved}
            showGuides={showGuides}
            tileTheme={tileTheme}
          />
        </div>

        {/* Progress indicator bar */}
        <div className="w-full max-w-[420px] px-1">
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1 font-medium">
            <span>Assembly Progress</span>
            <span className="tabular-nums">{Math.round((correctCount / 15) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-stone-800 dark:bg-stone-200 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(correctCount / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Ergonomic Action Bar (Thumb zone) */}
        <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isPuzzleSolved}
            className={`h-11 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              history.length > 0 && !isPuzzleSolved
                ? 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 shadow-sm'
                : 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-900/40 text-stone-400 border-transparent'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span>Undo Move {history.length > 0 ? `(${history.length})` : ''}</span>
          </button>

          <button
            onClick={() => handleNewGame(difficulty)}
            className="h-11 rounded-xl text-xs font-medium flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Reset Board</span>
          </button>
        </div>
      </main>

      {/* Footer / Instructions hint */}
      <footer className="w-full py-3 border-t border-stone-200/60 dark:border-stone-800/60 text-center text-[11px] text-stone-500 dark:text-stone-400 px-4">
        <span>Touch or swipe tiles to slide into the empty space · Arrow keys supported</span>
      </footer>

      {/* Modals */}
      <VictoryModal
        isOpen={isPuzzleSolved}
        timeSeconds={timeSeconds}
        moves={moves}
        difficulty={difficulty}
        isNewBestTime={isNewRecord.time}
        isNewBestMoves={isNewRecord.moves}
        onPlayAgain={() => handleNewGame(difficulty)}
        onChangeDifficulty={handleSelectDifficulty}
      />

      <InstructionModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
}
