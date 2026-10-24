/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, RotateCcw, Share2, Check, ArrowRight } from 'lucide-react';
import { Difficulty, DIFFICULTIES } from '../utils/puzzle';

interface VictoryModalProps {
  isOpen: boolean;
  timeSeconds: number;
  moves: number;
  difficulty: Difficulty;
  isNewBestTime: boolean;
  isNewBestMoves: boolean;
  onPlayAgain: () => void;
  onChangeDifficulty: (diff: Difficulty) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeSeconds,
  moves,
  difficulty,
  isNewBestTime,
  isNewBestMoves,
  onPlayAgain,
  onChangeDifficulty,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDiffConfig = DIFFICULTIES.find((d) => d.id === difficulty);
  const nextDiff: Difficulty | null =
    difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : null;

  const handleShare = async () => {
    const text = `🏆 Solved Slide15 (${currentDiffConfig?.label}) in ${formatTime(
      timeSeconds
    )} with ${moves} moves!`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 text-center">
        {/* Trophy icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
          <Trophy className="w-7 h-7" />
        </div>

        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Puzzle Solved!
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          All 15 tiles assembled in numerical order
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 my-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60">
          <div>
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              Total Time
            </div>
            <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums mt-0.5">
              {formatTime(timeSeconds)}
            </div>
            {isNewBestTime && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Personal Record
              </span>
            )}
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              Total Moves
            </div>
            <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums mt-0.5">
              {moves}
            </div>
            {isNewBestMoves && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Fewest Moves
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          {nextDiff && (
            <button
              onClick={() => onChangeDifficulty(nextDiff)}
              className="w-full h-11 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                Try Next Level ({DIFFICULTIES.find((d) => d.id === nextDiff)?.label})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleShare}
            className="w-full h-10 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Result</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
