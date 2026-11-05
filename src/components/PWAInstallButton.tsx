import React, { useState } from 'react';
import { Download, CheckCircle, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide button
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Installed Offline</span>
      </div>
    );
  }

  // Chromium / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 rounded-md transition-colors shadow-sm"
        title="Install FolioCraft as standalone offline app"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
              <h3 className="text-base font-semibold text-white mb-2">Install FolioCraft on iPhone/iPad</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                1. Tap the <strong className="text-amber-400">Share</strong> icon in the Safari toolbar.<br />
                2. Scroll down and select <strong className="text-amber-400">Add to Home Screen</strong>.<br />
                3. FolioCraft will run completely offline from your home screen.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
