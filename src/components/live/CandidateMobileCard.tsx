'use client';

import React from 'react';
import { LiveCandidateStatus, ScheduleItemData } from '@/types';
import { Radio, Navigation, Clock, CheckCircle, AlertTriangle, Play, ExternalLink, MapPin, Compass } from 'lucide-react';

interface CandidateMobileCardProps {
  status: LiveCandidateStatus | null;
  activeItem: ScheduleItemData | null;
  onMarkArrived: () => void;
  onMarkCompleted: () => void;
}

export default function CandidateMobileCard({
  status,
  activeItem,
  onMarkArrived,
  onMarkCompleted,
}: CandidateMobileCardProps) {
  if (!activeItem) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-3 shadow-md">
        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">All Scheduled Events Completed!</h3>
        <p className="text-xs text-slate-500">The campaign day itinerary has finished successfully.</p>
      </div>
    );
  }

  const loc = activeItem.event.location;
  const isDelayed = (status?.delayMinutes || 0) > 10;

  const handleOpenGoogleMaps = () => {
    if (!loc) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white border-2 border-blue-600 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
      {/* Live Badge Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> ● LIVE GPS
          </span>
          <span className="text-[11px] font-bold text-slate-500">Stop #{activeItem.sequence}</span>
        </div>

        {isDelayed ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> +{status?.delayMinutes}m DELAY
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ON SCHEDULE
          </span>
        )}
      </div>

      {/* Destination Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
        <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">NEXT DESTINATION</p>
        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
          {activeItem.event.title}
        </h2>

        {loc && (
          <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" /> {loc.name} {loc.address ? `• ${loc.address}` : ''}
          </p>
        )}
      </div>

      {/* Scheduled Time vs Live ETA */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase">Scheduled Arrival</p>
          <h3 className="text-base font-black text-slate-800 mt-0.5">{activeItem.plannedArrival}</h3>
        </div>

        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
          <p className="text-[10px] font-extrabold text-blue-600 uppercase">Live Traffic ETA</p>
          <h3 className="text-base font-black text-blue-700 mt-0.5 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" /> {status?.liveEta || activeItem.plannedArrival}
          </h3>
        </div>
      </div>

      {/* Navigation & Execution Actions */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4 fill-white" /> OPEN IN GOOGLE MAPS <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onMarkArrived}
            className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> ARRIVED
          </button>

          <button
            type="button"
            onClick={onMarkCompleted}
            className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" /> COMPLETED
          </button>
        </div>
      </div>
    </div>
  );
}
