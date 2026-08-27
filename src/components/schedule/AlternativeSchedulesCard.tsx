'use client';

import React from 'react';
import { ScheduleAlternative, ScheduleData } from '@/types';
import { formatDistance, formatDuration } from '@/lib/optimizer/constraints';
import { Sparkles, Navigation, Clock, Calendar, CheckCircle2, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

interface AlternativeSchedulesCardProps {
  alternatives: ScheduleAlternative[];
  activeProfile: string;
  onSelectAlternative: (alt: ScheduleAlternative) => void;
}

export default function AlternativeSchedulesCard({
  alternatives,
  activeProfile,
  onSelectAlternative,
}: AlternativeSchedulesCardProps) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> 3 Best Optimized Alternatives
          </h3>
          <p className="text-xs text-slate-500">Compare metrics side-by-side & select active campaign schedule</p>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
          Google Routes Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alternatives.map((alt) => {
          const isActive = activeProfile === alt.profile;

          return (
            <div
              key={alt.profile}
              onClick={() => onSelectAlternative(alt)}
              className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    {alt.title}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{alt.description}</p>

                <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" /> Distance:
                    </span>
                    <span className="font-bold">{formatDistance(alt.totalDistanceMeters)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" /> Driving:
                    </span>
                    <span className="font-bold">{formatDuration(alt.totalTravelSeconds)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" /> Events:
                    </span>
                    <span className="font-bold">
                      {alt.eventsScheduledCount} / {alt.totalEventsCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    alt.riskScore === 'LOW'
                      ? 'bg-emerald-100 text-emerald-700'
                      : alt.riskScore === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" /> Risk: {alt.riskScore}
                </span>

                <button
                  type="button"
                  className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {isActive ? 'Published' : 'Select'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
