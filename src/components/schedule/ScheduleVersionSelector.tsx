'use client';

import React, { useState } from 'react';
import { ScheduleData } from '@/types';
import { History, ChevronDown, Check, RotateCcw } from 'lucide-react';

interface ScheduleVersionSelectorProps {
  currentSchedule: ScheduleData | null;
  historyVersions: ScheduleData[];
  onSelectVersion: (schedule: ScheduleData) => void;
}

export default function ScheduleVersionSelector({
  currentSchedule,
  historyVersions,
  onSelectVersion,
}: ScheduleVersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentSchedule) return null;

  const allVersions = historyVersions.length > 0 ? historyVersions : [currentSchedule];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 shadow-sm transition-colors"
      >
        <History className="w-3.5 h-3.5 text-blue-600" />
        <span>Version {currentSchedule.version} ({currentSchedule.optimizationProfile})</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-64 z-40 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Schedule Version History
          </div>

          {allVersions.map((ver) => {
            const isSelected = ver.id === currentSchedule.id;

            return (
              <div
                key={ver.id}
                onClick={() => {
                  onSelectVersion(ver);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-800">Version {ver.version}</div>
                  <div className="text-[10px] text-slate-500">
                    {ver.optimizationProfile} • {ver.items.length} Events
                  </div>
                </div>

                {isSelected ? (
                  <Check className="w-4 h-4 text-blue-600" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Restore</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
