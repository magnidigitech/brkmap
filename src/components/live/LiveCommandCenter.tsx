'use client';

import React from 'react';
import { LiveCandidateStatus, ScheduleItemData } from '@/types';
import { Radio, Navigation, Clock, CheckCircle, AlertTriangle, Play, FastForward, Zap, UserCheck, ShieldAlert } from 'lucide-react';

interface LiveCommandCenterProps {
  status: LiveCandidateStatus | null;
  activeItem?: ScheduleItemData | null;
  onMarkArrived: () => void;
  onMarkCompleted: () => void;
  onSkipEvent: () => void;
  onReoptimizeRemaining: () => void;
}

export default function LiveCommandCenter({
  status,
  activeItem,
  onMarkArrived,
  onMarkCompleted,
  onSkipEvent,
  onReoptimizeRemaining,
}: LiveCommandCenterProps) {
  if (!status) return null;

  const getStatusBadge = () => {
    switch (status.status) {
      case 'AT_EVENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> AT EVENT</span>;
      case 'DELAYED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> DELAYED (+{status.delayMinutes}m)</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300">DAY COMPLETED</span>;
      case 'ON_ROAD':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" /> ON ROAD</span>;
    }
  };

  return (
    <div className="bg-white border-2 border-blue-500/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 relative overflow-hidden">
      {/* Background Pulse Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Command Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">LIVE CAMPAIGN COMMAND CENTER</h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 font-medium">Real-Time Execution & GPS Traffic ETA Engine</p>
          </div>
        </div>

        {/* Live Re-optimize Button */}
        <button
          type="button"
          onClick={onReoptimizeRemaining}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300 animate-pulse" /> Re-optimize Remaining Day
        </button>
      </div>

      {/* Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Next Stop ETA */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Scheduled Stop</p>
          <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
            {status.nextEventTitle || 'Campaign Event'}
          </h4>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Scheduled: <strong>{status.scheduledArrival}</strong></span>
            <span className="text-blue-700 font-extrabold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Live ETA: {status.liveEta}
            </span>
          </div>
        </div>

        {/* Current Delay Offset */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule Variance</p>
          <h4 className="text-xs font-bold text-slate-900 mt-0.5">
            {status.delayMinutes === 0 ? (
              <span className="text-emerald-600 font-bold">On Schedule (0m delay)</span>
            ) : (
              <span className="text-rose-600 font-extrabold">+{status.delayMinutes} mins behind schedule</span>
            )}
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">
            Impact: <strong className="text-amber-700">Projected across upcoming legs</strong>
          </p>
        </div>

        {/* Current Candidate Position */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate GPS Location</p>
          <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-blue-600" /> {status.currentLocationName}
          </h4>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {status.currentLatitude.toFixed(4)}, {status.currentLongitude.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Quick Action Execution Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-slate-600 font-semibold flex items-center gap-1">
          <span>Active Stop #{activeItem?.sequence || 1}:</span>
          <span className="text-blue-700 font-bold">{activeItem?.event.title || 'Selected Event'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkArrived}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Mark Arrived
          </button>

          <button
            type="button"
            onClick={onMarkCompleted}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
          >
            <Play className="w-3.5 h-3.5" /> Mark Completed
          </button>

          <button
            type="button"
            onClick={onSkipEvent}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center gap-1"
          >
            <FastForward className="w-3.5 h-3.5 text-slate-500" /> Skip Stop
          </button>
        </div>
      </div>
    </div>
  );
}
