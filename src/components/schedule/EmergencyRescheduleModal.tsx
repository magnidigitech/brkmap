'use client';

import React, { useState } from 'react';
import { EventData, LocationData, ScheduleData } from '@/types';
import { AlertOctagon, Zap, ShieldAlert, Check, X, Clock, MapPin } from 'lucide-react';

interface EmergencyRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  onEmergencyOptimized: (schedule: ScheduleData, newEvent: EventData) => void;
}

export default function EmergencyRescheduleModal({
  isOpen,
  onClose,
  locations,
  onEmergencyOptimized,
}: EmergencyRescheduleModalProps) {
  const [urgentTitle, setUrgentTitle] = useState('Urgent Media Address & Crisis Meeting');
  const [urgentLocId, setUrgentLocId] = useState(locations[0]?.id || '');
  const [urgentTime, setUrgentTime] = useState('15:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmergencyTrigger = async () => {
    setLoading(true);
    try {
      const chosenLoc = locations.find((l) => l.id === urgentLocId) || locations[0];

      const urgentEvent: EventData = {
        id: `evt-urgent-${Date.now()}`,
        campaignId: 'cmp-guntur-2026',
        locationId: urgentLocId || locations[0]?.id,
        title: urgentTitle,
        description: 'EMERGENCY INSERTION: High priority candidate schedule update',
        eventType: 'PRESS_CONF',
        date: '2026-08-28',
        preferredStart: urgentTime,
        preferredEnd: urgentTime,
        fixedStart: urgentTime,
        fixedEnd: urgentTime,
        durationMinutes: Number(durationMinutes),
        priority: 100,
        isFixed: true,
        isFlexible: false,
        status: 'PLANNED',
        location: chosenLoc,
      };

      const res = await fetch('/api/schedules/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'cmp-guntur-2026',
          date: '2026-08-28',
          startLocationId: locations[0]?.id,
          endLocationId: locations[0]?.id,
          startTime: '08:00',
          endTime: '20:00',
          profile: 'BALANCED',
        }),
      });

      const data = await res.json();
      if (data.success && data.schedule) {
        onEmergencyOptimized(data.schedule, urgentEvent);
        onClose();
      }
    } catch (err) {
      console.error('Emergency reschedule error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Emergency Reschedule</h3>
              <p className="text-xs text-slate-500">Insert unscheduled event & re-optimize timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Urgent Event Name</label>
            <input
              type="text"
              value={urgentTitle}
              onChange={(e) => setUrgentTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Location</label>
            <select
              value={urgentLocId}
              onChange={(e) => setUrgentLocId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Required Time</label>
              <input
                type="time"
                value={urgentTime}
                onChange={(e) => setUrgentTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Duration (mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
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
            onClick={handleEmergencyTrigger}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Zap className="w-4 h-4 animate-spin" /> Re-calculating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Execute Emergency Reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
