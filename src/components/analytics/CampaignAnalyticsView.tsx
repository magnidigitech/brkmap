'use client';

import React, { useEffect, useState } from 'react';
import { CampaignAnalyticsData } from '@/types';
import { BarChart3, TrendingUp, Navigation, Clock, CheckCircle2, AlertTriangle, Building2, ShieldCheck, Sparkles } from 'lucide-react';

export default function CampaignAnalyticsView() {
  const [data, setData] = useState<CampaignAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        Loading campaign operational intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.completionRatePercent}%</h3>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            {data.eventsCompleted} / {data.eventsPlanned} Events Completed
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Distance</span>
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.totalDistanceKm} km</h3>
          <p className="text-[10px] text-blue-600 font-semibold mt-1">
            Across Guntur Parliamentary Campaign
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Schedule Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{data.scheduleAccuracyPercent}%</h3>
          <p className="text-[10px] text-indigo-600 font-semibold mt-1">
            Avg Delay: +{data.averageDelayMinutes} mins
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Event Overrun</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">+{data.averageEventOverrunMinutes}m</h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            Variance over planned duration
          </p>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Event Category Performance Breakdown
            </h3>
            <p className="text-xs text-slate-500">Historical duration averages & completion rates by event type</p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Historical Intelligence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.categoryStats.map((stat, i) => {
            const pct = Math.round((stat.completed / stat.total) * 100);

            return (
              <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{stat.category}</span>
                  <span className="text-blue-700">{pct}% Completion ({stat.completed}/{stat.total})</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Historical Average Duration: <strong>{stat.avgDurationMinutes}m</strong></span>
                  <span className="text-emerald-700 font-semibold">High Reliability</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
