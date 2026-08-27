'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Dashboard Workspace Error</h3>
          <p className="text-xs text-slate-500 mt-1">An unexpected error occurred rendering dashboard components.</p>
        </div>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset View
        </button>
      </div>
    </div>
  );
}
