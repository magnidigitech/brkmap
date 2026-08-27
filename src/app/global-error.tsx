'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Global System Error</h2>
            <p className="text-xs text-slate-500 mt-1">MapOptima encountered a critical layout error.</p>
          </div>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
