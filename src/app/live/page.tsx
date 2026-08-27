'use client';

import React, { useState, useEffect } from 'react';
import { CampaignData, EventData, LocationData, LiveCandidateStatus, ScheduleData, ScheduleItemData } from '@/types';
import { INITIAL_CAMPAIGN, INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import CandidateMobileCard from '@/components/live/CandidateMobileCard';
import { optimizeCampaignSchedule } from '@/lib/optimizer/optimizer';
import { calculateRealtimeCandidateEta } from '@/lib/optimizer/eta';
import { updateEventExecutionStatus } from '@/lib/optimizer/execution';
import { Compass, Radio, UserCheck, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CandidateLivePage() {
  const [campaign] = useState<CampaignData>(INITIAL_CAMPAIGN);
  const [locations] = useState<LocationData[]>(INITIAL_LOCATIONS);
  const [events] = useState<EventData[]>(INITIAL_EVENTS);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveCandidateStatus | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    initLiveSchedule();
    setupGeolocationWatch();
  }, []);

  const initLiveSchedule = async () => {
    try {
      const optResult = await optimizeCampaignSchedule(
        {
          campaignId: campaign.id,
          date: '2026-08-28',
          startLocationId: locations[0]?.id,
          endLocationId: locations[0]?.id,
          startTime: '08:00',
          endTime: '20:00',
          profile: 'BALANCED',
        },
        events,
        locations
      );
      setSchedule(optResult.primarySchedule);
    } catch (err) {
      console.error('Failed to init live schedule:', err);
    }
  };

  const setupGeolocationWatch = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          sendLocationPing(lat, lng);
        },
        (err) => {
          setGeoError('GPS Permission Pending. Simulating live route tracking.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const sendLocationPing = async (latitude: number, longitude: number) => {
    try {
      await fetch('/api/live/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: campaign.id,
          latitude,
          longitude,
        }),
      });
    } catch (e) {
      // Ignore background ping errors
    }
  };

  useEffect(() => {
    if (schedule && schedule.items && locations && locations.length > 0) {
      const activeLoc = locations[2] || locations[0];
      if (activeLoc) {
        const live = calculateRealtimeCandidateEta(
          activeLoc.latitude,
          activeLoc.longitude,
          activeLoc.name,
          schedule.items,
          campaign.candidateName
        );
        setLiveStatus(live);
      }
    }
  }, [schedule, locations, campaign.candidateName]);

  const activeItem = schedule?.items.find((i) => i.execution?.status !== 'COMPLETED') || null;

  const handleMarkArrived = () => {
    if (!schedule || !activeItem) return;
    const updatedItems = schedule.items.map((item) =>
      item.id === activeItem.id ? updateEventExecutionStatus(item, 'ARRIVED', '10:15') : item
    );
    setSchedule({ ...schedule, items: updatedItems });
  };

  const handleMarkCompleted = () => {
    if (!schedule || !activeItem) return;
    const updatedItems = schedule.items.map((item) =>
      item.id === activeItem.id ? updateEventExecutionStatus(item, 'COMPLETED', '11:45') : item
    );
    setSchedule({ ...schedule, items: updatedItems });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 max-w-md mx-auto flex flex-col justify-between space-y-4">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center">
          <h1 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1 justify-center">
            MAGNI MAP LIVE <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold">{campaign.candidateName}</p>
        </div>

        <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <Compass className="w-4 h-4" />
        </div>
      </div>

      {geoError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Main Execution Card */}
      <div className="flex-1">
        <CandidateMobileCard
          status={liveStatus}
          activeItem={activeItem}
          onMarkArrived={handleMarkArrived}
          onMarkCompleted={handleMarkCompleted}
        />
      </div>

      {/* Upcoming Stops Preview List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Remaining Day Itinerary</h3>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {schedule?.items.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                item.execution?.status === 'COMPLETED'
                  ? 'bg-slate-50 opacity-60 border-slate-200 line-through'
                  : item.id === activeItem?.id
                  ? 'bg-blue-50/90 border-blue-400 font-bold'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="truncate max-w-[180px] font-semibold">{item.sequence}. {item.event.title}</span>
              <span className="text-[11px] text-slate-500 font-mono">{item.plannedArrival}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
