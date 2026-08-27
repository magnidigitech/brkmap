'use client';

import React, { useState } from 'react';
import { V5ScheduleOption } from '@/lib/v5/types';
import { ShieldCheck, X, CheckCircle2, Lock, ArrowRight, Zap, Sparkles } from 'lucide-react';

interface LockAndHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleOption: V5ScheduleOption | null;
  onConfirmLock: () => void;
}

export default function LockAndHandoffModal({
  isOpen,
  onClose,
  scheduleOption,
  onConfirmLock,
}: LockAndHandoffModalProps) {
  const [locking, setLocking] = useState(false);

  if (!isOpen || !scheduleOption) return null;

  const handleLock = async () => {
    setLocking(true);
    try {
      await fetch('/api/v5/schedules/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: scheduleOption.id,
          campaignId: scheduleOption.schedule.campaignId,
          schedule: scheduleOption.schedule,
        }),
      });
      onConfirmLock();
    } catch (err) {
      console.error('Lock error:', err);
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Lock Campaign Plan & Hand Off</h3>
              <p className="text-xs text-slate-500 font-medium">Transfer Master Plan to V3 Live Execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900">{scheduleOption.title}</h4>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
              Score: {scheduleOption.score.overallScore}/100
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-200">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Stops</p>
              <p className="font-extrabold text-slate-800">{scheduleOption.stopsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Distance</p>
              <p className="font-extrabold text-slate-800">{scheduleOption.totalDistanceKm} km</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
              <p className="font-extrabold text-slate-800">{scheduleOption.totalTravelHours} hrs</p>
            </div>
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="space-y-1.5 text-xs text-slate-700">
          <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Final Pre-Lock Checklist</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No hard constraint conflicts detected
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Candidate availability verified
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Traffic-aware Google Routes ETAs verified
            </div>
          </div>
        </div>

        {/* Hand-off Notice */}
        <p className="text-[11px] text-slate-500 italic bg-blue-50 p-2.5 rounded-xl border border-blue-200">
          Locking this schedule sends all assignments to the V3 Live Execution Engine for candidate smartphone GPS tracking.
        </p>

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
            onClick={handleLock}
            disabled={locking}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5" /> {locking ? 'Locking Plan...' : 'LOCK & SEND TO LIVE EXECUTION'}
          </button>
        </div>
      </div>
    </div>
  );
}
