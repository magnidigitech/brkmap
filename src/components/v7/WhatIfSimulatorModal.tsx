'use client';

import React, { useState } from 'react';
import { WhatIfSimulationResult } from '@/lib/v7/types';
import { Play, X, AlertTriangle, ArrowRight, UserCheck, Clock, Navigation, CheckCircle2 } from 'lucide-react';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatIfSimulatorModal({
  isOpen,
  onClose,
}: WhatIfSimulatorModalProps) {
  const [scenarioType, setScenarioType] = useState<'CANDIDATE_UNAVAILABILITY' | 'TIME_SHIFT'>('CANDIDATE_UNAVAILABILITY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfSimulationResult | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v7/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: scenarioType }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setResult(json.result);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Play className="w-5 h-5 fill-blue-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">V7 "What-If" Scenario Simulator</h2>
              <p className="text-xs text-slate-500">Predict schedule impact before locking master plans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Scenario to Simulate</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setScenarioType('CANDIDATE_UNAVAILABILITY'); setResult(null); }}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                scenarioType === 'CANDIDATE_UNAVAILABILITY'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Candidate Unavailability
            </button>
            <button
              type="button"
              onClick={() => { setScenarioType('TIME_SHIFT'); setResult(null); }}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                scenarioType === 'TIME_SHIFT'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Event Time-Shift (4 PM → 6 PM)
            </button>
          </div>
        </div>

        {/* Run Action */}
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          {loading ? 'Simulating Campaign Impact...' : 'Run Simulation'}
        </button>

        {/* Simulation Result Preview */}
        {result && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-amber-300">{result.scenarioTitle}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                +{result.riskChangePercent}% Risk Delta
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-800 rounded-xl">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Affected Stops</p>
                <p className="font-extrabold text-white">{result.affectedStopsCount} stops</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Delta Travel</p>
                <p className="font-extrabold text-amber-300">+{result.additionalDistanceKm} km</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Expected Delay</p>
                <p className="font-extrabold text-rose-400">+{result.expectedDelayMinutes} mins</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 pt-1 leading-relaxed">{result.summaryRationale}</p>

            {result.recommendedReplacementCandidate && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span>Replacement: {result.recommendedReplacementCandidate}</span>
                <span className="font-bold">{result.recommendedReplacementScore}% Match</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
