'use client';

import React, { useState } from 'react';
import { ConflictResolution, V5ScheduleOption } from '@/lib/v5/types';
import { Users, AlertTriangle, Zap, CheckCircle2, Clock, MapPin, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface MasterScheduleBoardProps {
  scheduleOption: V5ScheduleOption | null;
  conflicts: ConflictResolution[];
  onAutoFixConflict: (conflictId: string) => void;
}

export default function MasterScheduleBoard({
  scheduleOption,
  conflicts,
  onAutoFixConflict,
}: MasterScheduleBoardProps) {
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  if (!scheduleOption) return null;

  const handleFix = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
    onAutoFixConflict(id);
  };

  const activeConflicts = conflicts.filter((c) => !resolvedIds.includes(c.id));

  return (
    <div className="space-y-5">
      {/* Conflicts Alert Section */}
      {activeConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h4 className="text-xs font-bold text-amber-900">
                {activeConflicts.length} Conflict(s) Detected in Master Schedule
              </h4>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Requires Operational Action
            </span>
          </div>

          <div className="space-y-2">
            {activeConflicts.map((c) => (
              <div key={c.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">{c.title}</p>
                  <p className="text-[11px] text-slate-600">{c.description}</p>
                  {c.suggestedAction && (
                    <p className="text-[10px] font-semibold text-blue-700 flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-blue-600" /> Recommendation: {c.suggestedAction}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleFix(c.id)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shrink-0 flex items-center gap-1 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Auto Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Candidate Schedule Timelines Board */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Multi-Candidate Schedule Board
            </h3>
            <p className="text-xs text-slate-500">28 August 2026 • Assigned Campaign Timelines</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Feasible
          </span>
        </div>

        {/* Candidate Timeline Cards */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-extrabold text-slate-900">Hon. Nara Lokesh (Primary Candidate)</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{scheduleOption.stopsCount} Stops • {scheduleOption.totalDistanceKm} km</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {scheduleOption.schedule.items.slice(0, 6).map((item) => (
                <div key={item.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">{item.sequence}. {item.event.title}</span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold">{item.plannedArrival}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{item.event.location?.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
