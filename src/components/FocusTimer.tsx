import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Bell,
  BellOff,
  Sparkles,
  ChevronDown,
  X,
  Volume2,
  Coffee,
} from 'lucide-react';

interface FocusTimerProps {
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

const PRESETS = [
  { label: '15m', minutes: 15, desc: 'Quick Sprint' },
  { label: '25m', minutes: 25, desc: 'Pomodoro' },
  { label: '45m', minutes: 45, desc: 'Deep Flow' },
  { label: '60m', minutes: 60, desc: 'Writing Hour' },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({ focusMode, onToggleFocusMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [status, setStatus] = useState<TimerStatus>('idle');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoEnableFocusMode, setAutoFocusMode] = useState(false);
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Play a soft, pleasant chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Play warm chord C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime note could not be played:', e);
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Main countdown interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (status === 'running') {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            setStatus('completed');
            setShowCompletionNotification(true);
            playChime();

            // Try desktop notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('FolioCraft Studio', {
                  body: `Focus Session finished! You completed ${selectedMinutes} minutes of writing.`,
                  icon: '/favicon.ico',
                });
              } catch {
                // Ignore notification failure
              }
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, selectedMinutes, soundEnabled]);

  const handleStart = (mins?: number) => {
    const m = mins || (isCustom ? parseInt(customMinutesInput, 10) || 25 : selectedMinutes);
    const secs = m * 60;
    setSelectedMinutes(m);
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setStatus('running');
    setShowCompletionNotification(false);

    // Auto-enable focus mode if option checked and not already active
    if (autoEnableFocusMode && !focusMode) {
      onToggleFocusMode();
    }

    // Ask notification permission if default
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleResume = () => {
    setStatus('running');
  };

  const handleReset = () => {
    setStatus('idle');
    setSecondsRemaining(selectedMinutes * 60);
    setTotalSeconds(selectedMinutes * 60);
    setShowCompletionNotification(false);
  };

  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
    setTotalSeconds((prev) => prev + 300);
    if (status === 'completed') {
      setStatus('running');
      setShowCompletionNotification(false);
    }
  };

  const handleStartBreak = (minutes: number = 5) => {
    const secs = minutes * 60;
    setSelectedMinutes(minutes);
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setStatus('running');
    setShowCompletionNotification(false);
  };

  // Format time as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100))
    : 0;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all select-none ${
          status === 'running'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
            : status === 'paused'
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
            : status === 'completed'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent'
        }`}
        title="Focus Session Timer (Writing Sprint)"
      >
        <Clock
          className={`w-3.5 h-3.5 ${
            status === 'running'
              ? 'text-amber-400 animate-spin-slow'
              : status === 'completed'
              ? 'text-emerald-400'
              : 'text-stone-400'
          }`}
        />

        {status === 'idle' ? (
          <span className="hidden sm:inline font-medium">Sprint</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tracking-tight">
              {formatTime(secondsRemaining)}
            </span>
            {status === 'paused' && (
              <span className="text-[10px] text-yellow-400 font-semibold">(Paused)</span>
            )}
            {status === 'completed' && (
              <span className="text-[10px] text-emerald-400 font-semibold">Done!</span>
            )}
          </div>
        )}

        <ChevronDown className="w-3 h-3 text-stone-500" />
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-4 z-50 text-stone-200 animate-fade-in text-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-100 text-xs">Writing Sprint Timer</h3>
                <p className="text-[10px] text-stone-400">Set uninterrupted focus intervals</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-md transition-colors ${
                  soundEnabled ? 'text-amber-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-800'
                }`}
                title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Progress Display */}
          <div className="text-center py-2 bg-stone-950/80 rounded-xl border border-stone-800/80 px-3">
            <div className="font-mono text-3xl font-extrabold text-stone-100 tracking-wider">
              {formatTime(secondsRemaining)}
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-stone-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  status === 'completed'
                    ? 'bg-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 font-mono">
              <span>{progressPercent}% elapsed</span>
              <span>{Math.round(totalSeconds / 60)}m target</span>
            </div>
          </div>

          {/* Quick Presets (Available when idle or to reset) */}
          {status === 'idle' && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Sprint Duration:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedMinutes(p.minutes);
                      setSecondsRemaining(p.minutes * 60);
                      setTotalSeconds(p.minutes * 60);
                    }}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      !isCustom && selectedMinutes === p.minutes
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-850'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[9px] text-stone-500">{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Custom mins"
                  value={customMinutesInput}
                  onChange={(e) => {
                    setCustomMinutesInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (val > 0) {
                      setIsCustom(true);
                      setSelectedMinutes(val);
                      setSecondsRemaining(val * 60);
                      setTotalSeconds(val * 60);
                    }
                  }}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-500">minutes</span>
              </div>
            </div>
          )}

          {/* Preferences Checkbox */}
          <div className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/60 space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-stone-300">
              <input
                type="checkbox"
                checked={autoEnableFocusMode}
                onChange={(e) => setAutoFocusMode(e.target.checked)}
                className="rounded border-stone-700 text-amber-500 focus:ring-amber-500/20"
              />
              <span>Enter Focus Mode automatically upon starting</span>
            </label>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {status === 'idle' && (
              <button
                type="button"
                onClick={() => handleStart()}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-stone-950" />
                <span>Start {selectedMinutes}m Sprint</span>
              </button>
            )}

            {status === 'running' && (
              <>
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddFiveMinutes}
                  className="px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-800 text-amber-400 text-xs font-semibold transition-colors"
                  title="Add 5 minutes to sprint"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                  title="Cancel Sprint"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {status === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={handleResume}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-stone-950" />
                  <span>Resume Sprint</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                  title="Reset Sprint"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {status === 'completed' && (
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={() => handleStart(25)}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-stone-950" />
                  <span>Start New 25m Sprint</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartBreak(5)}
                  className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Take 5-Minute Break</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating subtle completion toast/banner */}
      {showCompletionNotification && (
        <div className="fixed top-16 right-4 z-50 bg-stone-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl max-w-sm text-xs animate-slide-in text-stone-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-100 text-sm">Focus Session Complete! 🎉</h4>
                <p className="text-stone-300 mt-0.5 text-[11px]">
                  You finished your {selectedMinutes}-minute writing sprint. Outstanding focus!
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleStartBreak(5)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Coffee className="w-3 h-3" />
                    <span>5m Break</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStart(25)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] transition-colors"
                  >
                    New 25m Sprint
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCompletionNotification(false)}
              className="text-stone-500 hover:text-stone-300 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
