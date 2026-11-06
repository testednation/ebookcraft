import React, { useState } from 'react';
import { Target, Settings2, Flame, TrendingUp } from 'lucide-react';
import { Book, Chapter } from '../types/book';

interface GoalTrackerWidgetProps {
  book: Book;
  chapters: Chapter[];
  activeChapter: Chapter | null;
  onUpdateBookGoals: (goals: { targetWordCount: number; dailyWordGoal: number; resetTodayBaseline?: boolean }) => void;
  onUpdateChapterTarget: (chapterId: string, target: number) => void;
}

export const GoalTrackerWidget: React.FC<GoalTrackerWidgetProps> = ({
  book,
  chapters,
  activeChapter,
  onUpdateBookGoals,
  onUpdateChapterTarget,
}) => {
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'chapter' | 'book'>('daily');

  const [dailyGoalInput, setDailyGoalInput] = useState(book.dailyWordGoal || 1000);
  const [bookTargetInput, setBookTargetInput] = useState(book.targetWordCount || 60000);
  const [chapterTargetInput, setChapterTargetInput] = useState(
    activeChapter?.targetWordCount || 2500
  );

  React.useEffect(() => {
    setDailyGoalInput(book.dailyWordGoal || 1000);
    setBookTargetInput(book.targetWordCount || 60000);
    setChapterTargetInput(activeChapter?.targetWordCount || 2500);
  }, [book.dailyWordGoal, book.targetWordCount, activeChapter?.id, activeChapter?.targetWordCount]);

  const totalBookWords = chapters.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const bookTarget = book.targetWordCount || 60000;
  const bookPercent = Math.min(100, Math.round((totalBookWords / Math.max(1, bookTarget)) * 100));

  const todayStr = new Date().toISOString().slice(0, 10);
  const baselineWords =
    book.dailyBaselineDate === todayStr ? (book.dailyBaselineWords ?? totalBookWords) : totalBookWords;
  const wordsToday = Math.max(0, totalBookWords - baselineWords);
  const dailyGoal = book.dailyWordGoal || 1000;
  const dailyPercent = Math.min(100, Math.round((wordsToday / Math.max(1, dailyGoal)) * 100));

  const chapterWords = activeChapter?.wordCount || 0;
  const chapterTarget = activeChapter?.targetWordCount || 2500;
  const chapterPercent = Math.min(100, Math.round((chapterWords / Math.max(1, chapterTarget)) * 100));

  const outerRadius = 34;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (dailyPercent / 100) * outerCircumference;

  const innerRadius = 26;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerOffset = innerCircumference - (chapterPercent / 100) * innerCircumference;

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBookGoals({
      targetWordCount: Math.max(100, bookTargetInput),
      dailyWordGoal: Math.max(10, dailyGoalInput),
    });
    if (activeChapter) {
      onUpdateChapterTarget(activeChapter.id, Math.max(100, chapterTargetInput));
    }
    setIsEditingGoals(false);
  };

  const handleResetToday = () => {
    onUpdateBookGoals({
      targetWordCount: bookTarget,
      dailyWordGoal: dailyGoal,
      resetTodayBaseline: true,
    });
  };

  return (
    <div className="bg-neutral-950/90 border-t border-neutral-800/90 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
            Output &amp; Goals
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsEditingGoals(!isEditingGoals)}
          className={`p-1 rounded text-neutral-400 hover:text-white transition ${
            isEditingGoals ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-neutral-800'
          }`}
          title="Adjust word count targets"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isEditingGoals ? (
        <form onSubmit={handleSaveGoals} className="space-y-2 pt-1 text-xs">
          <div>
            <label className="text-[10px] text-neutral-400 flex justify-between">
              <span>Daily Goal (Words)</span>
              <span className="text-amber-400 font-mono">{dailyGoalInput}w</span>
            </label>
            <input
              type="number"
              step="50"
              min="50"
              value={dailyGoalInput}
              onChange={(e) => setDailyGoalInput(parseInt(e.target.value, 10) || 500)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 flex justify-between">
              <span>Book Target (Words)</span>
              <span className="text-amber-400 font-mono">{(bookTargetInput / 1000).toFixed(0)}k</span>
            </label>
            <input
              type="number"
              step="1000"
              min="1000"
              value={bookTargetInput}
              onChange={(e) => setBookTargetInput(parseInt(e.target.value, 10) || 50000)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {activeChapter && (
            <div>
              <label className="text-[10px] text-neutral-400 flex justify-between">
                <span>Current Chapter Target</span>
                <span className="text-emerald-400 font-mono">{chapterTargetInput}w</span>
              </label>
              <input
                type="number"
                step="250"
                min="250"
                value={chapterTargetInput}
                onChange={(e) => setChapterTargetInput(parseInt(e.target.value, 10) || 2000)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleResetToday}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 underline"
              title="Reset today's baseline to current total"
            >
              Reset Today
            </button>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingGoals(false)}
                className="px-2 py-1 text-[11px] bg-neutral-800 text-neutral-300 rounded hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded transition"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div
              className="relative w-20 h-20 shrink-0 cursor-pointer flex items-center justify-center group"
              onClick={() => {
                setViewMode((prev) => (prev === 'daily' ? 'chapter' : prev === 'chapter' ? 'book' : 'daily'));
              }}
              title="Click to toggle focus between Daily, Chapter, and Book goals"
            >
              <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={outerRadius} stroke="#262626" strokeWidth="5" fill="none" />
                <circle cx="40" cy="40" r={innerRadius} stroke="#1c1c1c" strokeWidth="4" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r={outerRadius}
                  stroke={dailyPercent >= 100 ? '#10b981' : '#f59e0b'}
                  strokeWidth="5"
                  strokeDasharray={outerCircumference}
                  strokeDashoffset={outerOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={innerRadius}
                  stroke={chapterPercent >= 100 ? '#10b981' : '#38bdf8'}
                  strokeWidth="4"
                  strokeDasharray={innerCircumference}
                  strokeDashoffset={innerOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {viewMode === 'daily' ? (
                  <>
                    <span className="text-xs font-bold font-mono text-white leading-tight">
                      {dailyPercent}%
                    </span>
                    <span className="text-[8px] text-amber-400 font-medium uppercase tracking-tight">
                      Today
                    </span>
                  </>
                ) : viewMode === 'chapter' ? (
                  <>
                    <span className="text-xs font-bold font-mono text-white leading-tight">
                      {chapterPercent}%
                    </span>
                    <span className="text-[8px] text-sky-400 font-medium uppercase tracking-tight">
                      Chapter
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold font-mono text-white leading-tight">
                      {bookPercent}%
                    </span>
                    <span className="text-[8px] text-neutral-400 font-medium uppercase tracking-tight">
                      Book
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 text-xs">
              <div
                onClick={() => setViewMode('daily')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  viewMode === 'daily'
                    ? 'bg-amber-500/15 border border-amber-500/30'
                    : 'hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium flex items-center gap-1">
                    <Flame className={`w-3 h-3 ${wordsToday > 0 ? 'text-amber-400' : 'text-neutral-600'}`} />
                    Today's Output
                  </span>
                  <span className="font-mono text-neutral-200 font-semibold">
                    {wordsToday.toLocaleString()} <span className="text-neutral-500 font-normal">/ {dailyGoal.toLocaleString()}w</span>
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      dailyPercent >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${dailyPercent}%` }}
                  />
                </div>
              </div>

              <div
                onClick={() => setViewMode('chapter')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  viewMode === 'chapter'
                    ? 'bg-sky-500/15 border border-sky-500/30'
                    : 'hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium flex items-center gap-1 truncate pr-1">
                    <TrendingUp className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="truncate">{activeChapter?.title || 'Chapter'}</span>
                  </span>
                  <span className="font-mono text-neutral-200 font-semibold shrink-0">
                    {chapterWords.toLocaleString()} <span className="text-neutral-500 font-normal">/ {chapterTarget.toLocaleString()}w</span>
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      chapterPercent >= 100 ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${chapterPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => setViewMode('book')}
            className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-[10px] text-neutral-400 transition ${
              viewMode === 'book' ? 'bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-900/60'
            }`}
          >
            <span>Manuscript Total:</span>
            <span className="font-mono text-neutral-300">
              <strong className="text-white">{totalBookWords.toLocaleString()}</strong> of {bookTarget.toLocaleString()} words ({bookPercent}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
