import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Book, Chapter, DailyWordHistoryEntry } from '../types/book';
import {
  ensure30DayWritingHistory,
  calculateVelocityMetrics,
  formatShortDate,
} from '../services/velocityService';
import {
  X,
  TrendingUp,
  Flame,
  Calendar,
  Target,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  BarChart3,
  Activity,
  Sliders,
} from 'lucide-react';

interface WritingVelocityModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapters: Chapter[];
  onOpenBookDetails?: () => void;
}

export const WritingVelocityModal: React.FC<WritingVelocityModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  onOpenBookDetails,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('30');
  const [chartType, setChartType] = useState<'daily' | 'cumulative' | 'trend'>('daily');

  const totalBookWords = useMemo(
    () => chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
    [chapters]
  );

  const history = useMemo(
    () => ensure30DayWritingHistory(book, totalBookWords),
    [book, totalBookWords]
  );

  const metrics = useMemo(
    () =>
      calculateVelocityMetrics(
        history,
        book.targetWordCount || 60000,
        book.dailyWordGoal || 1000
      ),
    [history, book.targetWordCount, book.dailyWordGoal]
  );

  // Filter history according to selected time range
  const filteredData = useMemo(() => {
    const days = parseInt(timeRange, 10);
    const slice = history.slice(-days);
    return slice.map((entry) => ({
      ...entry,
      displayDate: formatShortDate(entry.date),
      dailyGoal: book.dailyWordGoal || 1000,
    }));
  }, [history, timeRange, book.dailyWordGoal]);

  const targetWordCount = book.targetWordCount || 60000;
  const progressPercent = Math.min(
    100,
    Math.round((totalBookWords / Math.max(1, targetWordCount)) * 100)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl max-h-[94dvh] sm:max-h-[92vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Writing Velocity Dashboard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Last 30 Days Analytics
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Live output trends, author pacing cadence &amp; manuscript milestone forecasts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 border-b border-stone-800/80 bg-stone-950/40 shrink-0">
          {/* Card 1: 7-Day Moving Average */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                7-Day Velocity
              </span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-stone-100">
                {metrics.movingAverage7Day.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 font-sans">w/day</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
              <span>Goal: {book.dailyWordGoal || 1000}w</span>
              <span className="text-stone-600">&bull;</span>
              <span
                className={
                  metrics.movingAverage7Day >= (book.dailyWordGoal || 1000)
                    ? 'text-emerald-400 font-medium'
                    : 'text-amber-400 font-medium'
                }
              >
                {metrics.movingAverage7Day >= (book.dailyWordGoal || 1000)
                  ? 'Pacing above target'
                  : 'Steady cadence'}
              </span>
            </div>
          </div>

          {/* Card 2: 30-Day Total Words */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                30-Day Output
              </span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {metrics.total30DayWords.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 font-sans">words</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Across {metrics.activeDaysCount} active writing days
            </div>
          </div>

          {/* Card 3: Writing Streak */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                Active Streak
              </span>
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-orange-400">
                {metrics.currentStreak}
              </span>
              <span className="text-xs text-stone-400 font-sans">days in a row</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Best Day: {metrics.bestDay.words.toLocaleString()} words ({formatShortDate(metrics.bestDay.date)})
            </div>
          </div>

          {/* Card 4: Forecast Finish Date */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                Target Forecast
              </span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-serif text-indigo-300 truncate">
                {metrics.projectedCompletionDate || 'In Progress'}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1 truncate">
              {metrics.wordsRemaining.toLocaleString()} words to target
            </div>
          </div>
        </div>

        {/* Controls Toolbar: Chart Types and Time Range */}
        <div className="px-6 py-3 border-b border-stone-800 bg-stone-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'daily'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Daily Output (Bars)
            </button>
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'cumulative'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Cumulative Growth (Area)
            </button>
            <button
              onClick={() => setChartType('trend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                chartType === 'trend'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Velocity Trend (Line)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Window:</span>
            <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
              {(['7', '14', '30'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    timeRange === r
                      ? 'bg-stone-800 text-stone-100 font-bold'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {r} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chart Canvas using Recharts */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="h-72 w-full bg-stone-950/70 p-4 rounded-2xl border border-stone-800 relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'daily' ? (
                <BarChart data={filteredData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                    tickFormatter={(val) => `${val}w`}
                  />
                  <Tooltip content={<CustomTooltip dailyGoal={book.dailyWordGoal || 1000} />} />
                  <ReferenceLine
                    y={book.dailyWordGoal || 1000}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Daily Target (${book.dailyWordGoal || 1000}w)`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Bar dataKey="wordsWritten" radius={[4, 4, 0, 0]}>
                    {filteredData.map((entry, index) => {
                      const metGoal = entry.wordsWritten >= (book.dailyWordGoal || 1000);
                      const isZero = entry.wordsWritten === 0;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            isZero
                              ? '#3f3f46'
                              : metGoal
                              ? '#10b981'
                              : '#f59e0b'
                          }
                          fillOpacity={isZero ? 0.3 : 0.85}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : chartType === 'cumulative' ? (
                <AreaChart data={filteredData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip dailyGoal={book.dailyWordGoal || 1000} />} />
                  <ReferenceLine
                    y={book.targetWordCount || 60000}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    label={{
                      value: `Manuscript Target (${(targetWordCount / 1000).toFixed(0)}k)`,
                      fill: '#818cf8',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalWords"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={filteredData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#404040' }}
                    tickFormatter={(val) => `${val}w`}
                  />
                  <Tooltip content={<CustomTooltip dailyGoal={book.dailyWordGoal || 1000} />} />
                  <ReferenceLine
                    y={book.dailyWordGoal || 1000}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="wordsWritten"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ fill: '#38bdf8', r: 3 }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Manuscript Milestone Breakdown Progress Bar */}
          <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-stone-200">
                  Total Manuscript Progress
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-stone-300 font-bold">{totalBookWords.toLocaleString()}</span>
                <span className="text-stone-500">/ {targetWordCount.toLocaleString()} words</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Dynamic Visual Progress Bar */}
            <div className="relative w-full h-3 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 text-center pt-1 text-[11px] text-stone-400">
              <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                <div className="text-stone-500 text-[10px]">Chapters Formatted</div>
                <div className="font-bold text-stone-200 mt-0.5">{chapters.length} sections</div>
              </div>
              <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                <div className="text-stone-500 text-[10px]">Daily Target Success</div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {metrics.dailyGoalSuccessRate}% of writing days
                </div>
              </div>
              <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                <div className="text-stone-500 text-[10px]">Est. Book Print Pages</div>
                <div className="font-bold text-stone-200 mt-0.5">
                  ~{Math.ceil(totalBookWords / 280) + 8} pages
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Metadata automatically computes writing cadence upon chapter auto-saves.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBookDetails && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBookDetails();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Word Goals</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors"
            >
              Close Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom recharts tooltip matching FolioCraft editorial theme
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  dailyGoal: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, dailyGoal }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DailyWordHistoryEntry;
    const written = data.wordsWritten || 0;
    const total = data.totalWords || 0;
    const isGoalMet = written >= dailyGoal;

    return (
      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-700/80 shadow-2xl text-xs space-y-1 z-50">
        <div className="font-semibold text-stone-200 border-b border-stone-800 pb-1">
          {formatShortDate(data.date)}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">Words Written:</span>
          <span
            className={`font-mono font-bold ${
              written === 0 ? 'text-stone-500' : isGoalMet ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {written.toLocaleString()} words
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">Total Manuscript:</span>
          <span className="font-mono text-stone-200 font-semibold">{total.toLocaleString()} words</span>
        </div>
        {written > 0 && (
          <div className="text-[10px] text-stone-500 pt-0.5">
            {isGoalMet
              ? `✓ Target exceeded by ${(written - dailyGoal).toLocaleString()}w`
              : `${(dailyGoal - written).toLocaleString()}w to daily target`}
          </div>
        )}
      </div>
    );
  }
  return null;
};
