'use client';

import React, { useState } from 'react';
import { LocationData, OptimizationProfile, OptimizeRequestInput, ScheduleData } from '@/types';
import { Sparkles, Sliders, MapPin, Clock, Zap, CheckCircle2, X } from 'lucide-react';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  onOptimizationComplete: (schedule: ScheduleData, conflicts: string[]) => void;
}

export default function OptimizeModal({
  isOpen,
  onClose,
  locations,
  onOptimizationComplete,
}: OptimizeModalProps) {
  const [profile, setProfile] = useState<OptimizationProfile>('BALANCED');
  const [startLocId, setStartLocId] = useState(locations[0]?.id || '');
  const [endLocId, setEndLocId] = useState(locations[0]?.id || '');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const payload: OptimizeRequestInput = {
        campaignId: 'cmp-guntur-2026',
        date: '2026-08-28',
        startLocationId: startLocId || locations[0]?.id,
        endLocationId: endLocId || locations[0]?.id,
        startTime,
        endTime,
        profile,
      };

      const res = await fetch('/api/schedules/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.schedule) {
        onOptimizationComplete(data.schedule, data.conflicts || []);
        onClose();
      }
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const profiles: Array<{ id: OptimizationProfile; label: string; desc: string }> = [
    { id: 'BALANCED', label: 'Balanced Schedule', desc: 'Balances travel time, priority rewards, and comfort buffers.' },
    { id: 'MIN_TRAVEL_TIME', label: 'Minimum Travel Time', desc: 'Minimizes driving duration between events.' },
    { id: 'MIN_DISTANCE', label: 'Minimum Distance', desc: 'Saves fuel and reduces total kilometers driven.' },
    { id: 'MAX_EVENTS', label: 'Maximum Events', desc: 'Packs maximum possible campaign stops into the day.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Smart Schedule Optimizer</h3>
              <p className="text-xs text-slate-500">Google Routes API Matrix Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" /> Optimization Objective Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  profile === p.id
                    ? 'bg-blue-50 border-blue-500 text-slate-900 ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{p.label}</span>
                  {profile === p.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Windows & Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Day Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-600" /> Day End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Start Location
            </label>
            <select
              value={startLocId}
              onChange={(e) => setStartLocId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" /> End Location
            </label>
            <select
              value={endLocId}
              onChange={(e) => setEndLocId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Zap className="w-4 h-4 animate-spin" /> Calculating Matrix...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Best Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
