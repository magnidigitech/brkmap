'use client';

import React, { useEffect, useState } from 'react';
import { V7PredictiveIntelligencePayload } from '@/lib/v7/types';
import { Target, TrendingUp, AlertTriangle, ShieldCheck, Clock, Navigation, UserCheck, Play, HelpCircle, Activity } from 'lucide-react';

interface V7PredictiveDashboardProps {
  onOpenWhatIfSimulator: () => void;
}

export default function V7PredictiveDashboard({
  onOpenWhatIfSimulator,
}: V7PredictiveDashboardProps) {
  const [data, setData] = useState<V7PredictiveIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v7/predictions');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching V7 predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        Loading V7 Predictive Campaign Intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Predicted Reliability</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.campaignRisk.predictedScheduleReliabilityPercent}%</h3>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Pre-Lock Campaign Rating</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delay Risk Level</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.delayRisk.level}</h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            {data.delayRisk.riskPercent}% Risk • Data Confidence: {data.delayRisk.confidencePercent} (N={data.delayRisk.sampleCount})
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tight Travel Windows</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.campaignRisk.tightWindowsCount}</h3>
          <p className="text-[10px] text-blue-600 font-semibold mt-1">Sequential stops with &lt;15m buffer</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warning Flags</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.campaignRisk.warningFlagsCount}</h3>
          <p className="text-[10px] text-purple-600 font-semibold mt-1">Pre-lock checklist items</p>
        </div>
      </div>

      {/* Flagship What-If Simulator Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/30 text-amber-300">
            <Play className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">V7 "What-If" Scenario Simulator</h3>
            <p className="text-xs text-blue-200">Simulate candidate unavailability or time-window shifts before schedule locking</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenWhatIfSimulator}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-slate-900" /> Run "What-If" Simulation
        </button>
      </div>

      {/* Duration Range Predictions Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Predicted Event Visit Duration Ranges (Min – Expected – Max)
            </h3>
            <p className="text-xs text-slate-500">Calculated from standard deviation σ across historical campaign stops</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Deterministic Bounds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.durationPredictions.map((pred, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900">{pred.eventType}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {pred.confidencePercent}% Confidence ({pred.sampleCount} stops)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Min Duration</p>
                  <p className="font-extrabold text-slate-800">{pred.minDurationMinutes}m</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-[9px] text-blue-600 uppercase font-bold">Expected</p>
                  <p className="font-extrabold text-blue-700 text-sm">{pred.expectedDurationMinutes}m</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Max Duration</p>
                  <p className="font-extrabold text-rose-600">{pred.maxDurationMinutes}m</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Execution Reliability Profiles */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-purple-600" /> Candidate Operational Execution Profiles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.candidateAdherence.map((cand) => (
            <div key={cand.candidateId} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>{cand.candidateName}</span>
                <span className="text-purple-700 font-extrabold">{cand.scheduleAdherenceScore}% Adherence</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>On-Time Arrival: <strong>{cand.onTimeArrivalRatePercent}%</strong></span>
                <span>Avg Overrun: <strong>+{cand.averageOverrunMinutes}m</strong></span>
                <span>Events: <strong>{cand.historicalEventsCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
