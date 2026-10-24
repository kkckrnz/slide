/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Touchpad, Keyboard, CheckCircle2, Shuffle } from 'lucide-react';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 text-left">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              How to Play Slide15
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Classic 15-Puzzle mechanics with modern touch physics
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs text-stone-600 dark:text-stone-300">
          {/* Goal */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                Objective
              </div>
              <p className="mt-0.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                Slide the 15 numbered tiles into numerical order (1 through 15) from left to right, top to bottom. The bottom-right slot must be empty to complete the puzzle.
              </p>
            </div>
          </div>

          {/* Touch Gestures */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200/50">
              <Touchpad className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                Touch & Swipe Gestures
              </div>
              <p className="mt-0.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                Swipe or drag any tile towards the empty space. You can also tap any tile to slide it instantly. Tapping a tile further down the same row or column slides the entire row of tiles together!
              </p>
            </div>
          </div>

          {/* Keyboard Controls */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/50">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                Desktop Controls
              </div>
              <p className="mt-0.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                Use Arrow Keys or <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[11px]">W</kbd> <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[11px]">A</kbd> <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[11px]">S</kbd> <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[11px]">D</kbd> to slide adjacent tiles into the empty space.
              </p>
            </div>
          </div>

          {/* Home Markers */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-200/50">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                Position Indicators & Solvability
              </div>
              <p className="mt-0.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                A subtle pip at the bottom corner of a tile indicates it has reached its correct final position. Every scramble is mathematically verified to be 100% solvable.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 h-11 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
        >
          Got It, Let's Play
        </button>
      </div>
    </div>
  );
};
