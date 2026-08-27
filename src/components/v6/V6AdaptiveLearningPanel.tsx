'use client';

import React, { useEffect, useState } from 'react';
import { V6LearningInsights } from '@/lib/v6/types';
import { Brain, TrendingUp, Sparkles, CheckCircle2, Clock, Navigation, AlertTriangle, ShieldCheck, ArrowRight, Info, Layers } from 'lucide-react';

interface V6AdaptiveLearningPanelProps {
  onApplyLearningsToV5?: () => void;
}

export default function V6AdaptiveLearningPanel({
  onApplyLearningsToV5,
}: V6AdaptiveLearningPanelProps) {
  const [data, setData] = useState<V6LearningInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v6/learning');
      const json = await res.json();
      if (json.success && json.insights) {
        setData(json.insights);
      }
    } catch (err) {
      console.error('Error fetching V6 insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    setApplied(true);
    if (onApplyLearningsToV5) onApplyLearningsToV5();
  };

  if (loading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        Loading V6 Statistical Learning Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Predict → Plan Accuracy</span>
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.overallExecutionAccuracyPercent}%</h3>
          <p className="text-[10px] text-purple-600 font-semibold mt-1">
            Based on {data.totalEventsAnalyzed} completed campaign stops
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Event Overrun</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">+{data.averageOverrunMinutes} mins</h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            10% Trimmed Mean Outlier Filtered
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Corridor Reliability</span>
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">81% Reliable</h3>
          <p className="text-[10px] text-blue-600 font-semibold mt-1">
            Time-of-Day 2-Hour Corridor Modeling
          </p>
        </div>
      </div>

      {/* Adaptive Recommendations Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/30 border border-purple-400/30 text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">V6 Adaptive Feedback Recommendations</h3>
              <p className="text-xs text-purple-200">Creates a new V5 Schedule Version without mutating locked plans</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={applied}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
              applied
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-900 font-black'
            }`}
          >
            {applied ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4 text-slate-900" />}
            {applied ? 'New V5 Version Generated' : 'Apply Learnings & Generate New Version'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {data.recommendations.map((rec) => (
            <div key={rec.id} className="p-3 bg-white/10 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{rec.title}</span>
                <span className="text-amber-300">+{rec.impactScoreImprovement} Score</span>
              </div>
              <p className="text-[11px] text-purple-100">{rec.rationale}</p>
              <div className="text-[10px] text-amber-200 font-mono font-bold pt-1">
                Current Buffer: {rec.currentBufferMinutes}m → Recommended: {rec.recommendedBufferMinutes}m
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duration Pattern Models */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" /> Event Duration Pattern Models (Planned vs Actual)
            </h3>
            <p className="text-xs text-slate-500">{data.methodologyNotice}</p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            Outlier Filtered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.durationPatterns.map((pat, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900">{pat.eventType}</h4>
                {pat.status === 'SUFFICIENT_DATA' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {pat.reliabilityConfidence}% Data Confidence ({pat.sampleCount} stops)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    INSUFFICIENT DATA ({pat.sampleCount} stops)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Planned</p>
                  <p className="font-extrabold text-slate-800 text-xs">{pat.plannedAvgMinutes}m</p>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Actual Avg</p>
                  <p className="font-extrabold text-slate-800 text-xs">{pat.actualAvgMinutes}m</p>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Trimmed Mean</p>
                  <p className="font-extrabold text-rose-600 text-xs">{pat.trimmedMeanMinutes}m</p>
                </div>
                <div className="p-1.5 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-[9px] text-purple-600 uppercase font-bold">V6 Buffer</p>
                  <p className="font-extrabold text-purple-700 text-xs">{pat.recommendedBufferMinutes}m</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic mt-1">{pat.methodology}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time-of-Day Corridor Risk Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" /> Time-of-Day 2-Hour Corridor Reliability
        </h3>

        <div className="space-y-2">
          {data.routeCorridors.map((cor, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
              <div>
                <span className="font-bold text-slate-900">{cor.corridorName}</span>
                <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">{cor.timeWindow}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <span>Expected: <strong>{cor.expectedTravelMinutes}m</strong></span>
                <span>Actual: <strong className="text-rose-600">{cor.actualTravelMinutes}m</strong></span>
                <span className="font-bold text-emerald-700">{cor.reliabilityScorePercent}% Score</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
