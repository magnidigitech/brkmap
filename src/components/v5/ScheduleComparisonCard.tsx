'use client';

import React from 'react';
import { V5ScheduleOption } from '@/lib/v5/types';
import { Sparkles, Check, Compass, ShieldCheck, Zap, Award, CheckCircle } from 'lucide-react';

interface ScheduleComparisonCardProps {
  options: V5ScheduleOption[];
  selectedOptionId: string;
  onSelectOption: (option: V5ScheduleOption) => void;
}

export default function ScheduleComparisonCard({
  options,
  selectedOptionId,
  onSelectOption,
}: ScheduleComparisonCardProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" /> Multi-Strategy Campaign Plan Alternatives
          </h3>
          <p className="text-xs text-slate-500">Compare 0-100 score metrics across candidate strategies</p>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> V5 Engine Scored
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => onSelectOption(opt)}
              className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              {opt.isRecommended && (
                <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-sm uppercase tracking-wider">
                  ★ Recommended
                </span>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">{opt.title}</h4>
                  <span className="text-sm font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                    {opt.score.overallScore}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{opt.description}</p>
              </div>

              {/* Score Breakdown Bars */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px]">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Travel Efficiency</span>
                  <span className="font-bold text-slate-800">{opt.score.travelEfficiencyScore}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${opt.score.travelEfficiencyScore}%` }} />
                </div>

                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Priority Completion</span>
                  <span className="font-bold text-slate-800">{opt.score.priorityCompletionScore}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${opt.score.priorityCompletionScore}%` }} />
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-700 font-bold border-t border-slate-100">
                <span>{opt.totalDistanceKm} km</span>
                <span>{opt.totalTravelHours} hrs</span>
                <span>{opt.stopsCount} Stops</span>
              </div>

              <button
                type="button"
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                {isSelected ? 'Selected Master Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
