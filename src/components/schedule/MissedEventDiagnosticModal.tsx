'use client';

import React from 'react';
import { EventData, MissedEventDiagnostic } from '@/types';
import { analyzeWhyEventMissed } from '@/lib/optimizer/diagnostics';
import { HelpCircle, X, AlertTriangle, Clock, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

interface MissedEventDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
}

export default function MissedEventDiagnosticModal({
  isOpen,
  onClose,
  event,
}: MissedEventDiagnosticModalProps) {
  if (!isOpen || !event) return null;

  const diagnostic: MissedEventDiagnostic = analyzeWhyEventMissed(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Why Was This Event Delayed / Missed?</h3>
              <p className="text-xs text-slate-500 font-medium">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Impact Summary */}
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-amber-900 uppercase">Total Delay Variance Impact</p>
              <h4 className="text-sm font-extrabold text-amber-900">+{diagnostic.totalImpactMinutes} Minutes Over Planned Schedule</h4>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
            Root Cause Analysis
          </span>
        </div>

        {/* Factor Breakdown List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Delay Factor Breakdown</h4>
          <div className="space-y-2">
            {diagnostic.breakdown.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.factor}</span>
                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  +{item.impactMinutes}m
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Recommendation */}
        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Lightbulb className="w-4 h-4 text-blue-600" /> System Recommendation
          </div>
          <p className="text-xs text-blue-800">{diagnostic.recommendation}</p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
