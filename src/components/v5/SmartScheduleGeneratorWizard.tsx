'use client';

import React, { useState } from 'react';
import { Sparkles, X, Sliders, Calendar, Users, Zap, Check } from 'lucide-react';

interface SmartScheduleGeneratorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (strategy: string) => void;
}

export default function SmartScheduleGeneratorWizard({
  isOpen,
  onClose,
  onGenerate,
}: SmartScheduleGeneratorWizardProps) {
  const [strategy, setStrategy] = useState<'BALANCED' | 'MIN_TRAVEL' | 'PRIORITY_FIRST'>('BALANCED');
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleRun = () => {
    setGenerating(true);
    setTimeout(() => {
      onGenerate(strategy);
      setGenerating(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">V5 Smart Schedule Generator</h3>
              <p className="text-xs text-slate-500 font-medium">Multi-Candidate Strategy Optimization Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strategy Selection Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Optimization Strategy</label>
          <div className="space-y-2">
            <div
              onClick={() => setStrategy('BALANCED')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                strategy === 'BALANCED'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Best Balanced Strategy</h4>
                <p className="text-[11px] text-slate-500">Optimal balance of travel, priority rewards, and buffers.</p>
              </div>
              {strategy === 'BALANCED' && <Check className="w-4 h-4 text-blue-600" />}
            </div>

            <div
              onClick={() => setStrategy('MIN_TRAVEL')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                strategy === 'MIN_TRAVEL'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Minimum Travel Strategy</h4>
                <p className="text-[11px] text-slate-500">Minimizes driving distance and fuel consumption.</p>
              </div>
              {strategy === 'MIN_TRAVEL' && <Check className="w-4 h-4 text-blue-600" />}
            </div>

            <div
              onClick={() => setStrategy('PRIORITY_FIRST')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                strategy === 'PRIORITY_FIRST'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Priority First Strategy</h4>
                <p className="text-[11px] text-slate-500">100% completion of high-priority VIP meetings and rallies.</p>
              </div>
              {strategy === 'PRIORITY_FIRST' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> {generating ? 'Generating Plans...' : 'Generate Smart Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
