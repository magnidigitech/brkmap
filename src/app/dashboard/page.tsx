'use client';

import React, { useState, useEffect } from 'react';
import {
  CampaignData,
  EventData,
  LocationData,
  LiveCandidateStatus,
  ScheduleAlternative,
  ScheduleData,
  ScheduleItemData,
  ScheduleValidationResult,
} from '@/types';
import { V5GenerationResult, V5ScheduleOption } from '@/lib/v5/types';
import { INITIAL_CAMPAIGN, INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import CampaignMap from '@/components/maps/CampaignMap';
import ScheduleTimeline from '@/components/schedule/ScheduleTimeline';
import OptimizeModal from '@/components/schedule/OptimizeModal';
import EventModal from '@/components/events/EventModal';
import EmergencyRescheduleModal from '@/components/schedule/EmergencyRescheduleModal';
import AlternativeSchedulesCard from '@/components/schedule/AlternativeSchedulesCard';
import RouteMatrixModal from '@/components/maps/RouteMatrixModal';
import ScheduleVersionSelector from '@/components/schedule/ScheduleVersionSelector';
import LiveCommandCenter from '@/components/live/LiveCommandCenter';
import ContactModal from '@/components/contacts/ContactModal';
import CampaignAnalyticsView from '@/components/analytics/CampaignAnalyticsView';
import MissedEventDiagnosticModal from '@/components/schedule/MissedEventDiagnosticModal';
import ScheduleComparisonCard from '@/components/v5/ScheduleComparisonCard';
import MasterScheduleBoard from '@/components/v5/MasterScheduleBoard';
import LockAndHandoffModal from '@/components/v5/LockAndHandoffModal';
import SmartScheduleGeneratorWizard from '@/components/v5/SmartScheduleGeneratorWizard';
import V6AdaptiveLearningPanel from '@/components/v6/V6AdaptiveLearningPanel';
import V7PredictiveDashboard from '@/components/v7/V7PredictiveDashboard';
import WhatIfSimulatorModal from '@/components/v7/WhatIfSimulatorModal';
import DaySettingsModal, { DaySettingsData } from '@/components/schedule/DaySettingsModal';
import { formatDistance, formatDuration } from '@/lib/optimizer/constraints';
import { optimizeCampaignSchedule } from '@/lib/optimizer/optimizer';
import { calculateRealtimeCandidateEta } from '@/lib/optimizer/eta';
import { calculateProjectedDelayImpact, updateEventExecutionStatus } from '@/lib/optimizer/execution';
import { evaluateGeofenceBoundary } from '@/lib/geo/geofence';
import { generateV5SmartSchedule } from '@/lib/v5/engine';
import {
  Compass,
  Calendar,
  Sparkles,
  Plus,
  Zap,
  Navigation,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle,
  Building,
  ListOrdered,
  Map,
  BarChart2,
  Grid,
  Radio,
  SlidersHorizontal,
  HelpCircle,
  TrendingUp,
  Award,
  Lock,
  Brain,
  Target,
  Play,
  Settings2,
} from 'lucide-react';

export default function DashboardPage() {
  const [campaign] = useState<CampaignData>(INITIAL_CAMPAIGN);
  const [locations, setLocations] = useState<LocationData[]>(INITIAL_LOCATIONS);
  const [events, setEvents] = useState<EventData[]>(INITIAL_EVENTS);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [alternatives, setAlternatives] = useState<ScheduleAlternative[]>([]);
  const [validation, setValidation] = useState<ScheduleValidationResult | null>(null);
  const [historyVersions, setHistoryVersions] = useState<ScheduleData[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // V7, V6 & V5 Tab State
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'V5_SCHEDULING' | 'V6_LEARNING' | 'V7_PREDICTIVE' | 'ANALYTICS'>('WORKSPACE');
  const [v5Data, setV5Data] = useState<V5GenerationResult | null>(null);
  const [selectedV5Option, setSelectedV5Option] = useState<V5ScheduleOption | null>(null);

  // V3 Live Engine State
  const [mode, setMode] = useState<'PLANNING' | 'LIVE_DAY'>('PLANNING');
  const [mobileTab, setMobileTab] = useState<'timeline' | 'map' | 'stats'>('timeline');
  const [liveStatus, setLiveStatus] = useState<LiveCandidateStatus | null>(null);
  const [selectedContactItem, setSelectedContactItem] = useState<ScheduleItemData | null>(null);
  const [diagnosticEvent, setDiagnosticEvent] = useState<EventData | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [daySettings, setDaySettings] = useState<DaySettingsData>({
    startTime: '08:00',
    endTime: '20:00',
    startLocationId: '',
    endLocationId: '',
  });

  // Modals state
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isDaySettingsOpen, setIsDaySettingsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isV5WizardOpen, setIsV5WizardOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);

  // LocalStorage Keys
  const LS_EVENTS = 'magni_map_events_v2';
  const LS_LOCATIONS = 'magni_map_locations_v2';
  const LS_SETTINGS = 'magni_map_settings_v2';

  // Mount effect to restore from LocalStorage
  useEffect(() => {
    try {
      const cachedEvents = localStorage.getItem(LS_EVENTS);
      const cachedLocs = localStorage.getItem(LS_LOCATIONS);
      const cachedSettings = localStorage.getItem(LS_SETTINGS);

      if (cachedEvents) {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed);
      }
      if (cachedLocs) {
        const parsed = JSON.parse(cachedLocs);
        if (Array.isArray(parsed) && parsed.length > 0) setLocations(parsed);
      }
      if (cachedSettings) {
        const parsed = JSON.parse(cachedSettings);
        if (parsed && typeof parsed === 'object') setDaySettings(parsed);
      }
    } catch (e) {
      console.warn('LocalStorage cache load warning:', e);
    }
  }, []);

  const persistStateToLocalStorage = (nextEvts: EventData[], nextLocs: LocationData[], nextSettings?: DaySettingsData) => {
    try {
      localStorage.setItem(LS_EVENTS, JSON.stringify(nextEvts));
      localStorage.setItem(LS_LOCATIONS, JSON.stringify(nextLocs));
      if (nextSettings) {
        localStorage.setItem(LS_SETTINGS, JSON.stringify(nextSettings));
      } else if (daySettings) {
        localStorage.setItem(LS_SETTINGS, JSON.stringify(daySettings));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  useEffect(() => {
    runInitialOptimization(events, locations);
    loadV5EngineData(events, locations);
  }, [events, locations]);

  const loadV5EngineData = async (currentEvents: EventData[], currentLocs: LocationData[]) => {
    try {
      const result = await generateV5SmartSchedule(campaign.id, currentEvents, currentLocs);
      setV5Data(result);
      setSelectedV5Option(result.options[0] || null);
    } catch (err) {
      console.error('Error loading V5 engine:', err);
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
        const geofence = evaluateGeofenceBoundary(activeLoc.latitude, activeLoc.longitude, activeLoc, 150);
        live.geofence = geofence;

        setLiveStatus(live);
      }
    }
  }, [schedule, locations, campaign.candidateName]);

  const runInitialOptimization = async (
    currentEvents: EventData[],
    currentLocs: LocationData[],
    settings?: DaySettingsData
  ) => {
    try {
      const activeSettings = settings || daySettings;
      const startId = activeSettings.startLocationId || currentLocs[0]?.id;
      const endId = activeSettings.endLocationId || currentLocs[0]?.id;

      const eventsWithLocs = currentEvents.map((e) => ({
        ...e,
        location: e.location || currentLocs.find((l) => l.id === e.locationId),
      }));

      const optResult = await optimizeCampaignSchedule(
        {
          campaignId: campaign.id,
          date: '2026-08-28',
          startLocationId: startId,
          endLocationId: endId,
          startTime: activeSettings.startTime || '08:00',
          endTime: activeSettings.endTime || '20:00',
          profile: 'BALANCED',
        },
        eventsWithLocs,
        currentLocs
      );

      setSchedule(optResult.primarySchedule);
      setAlternatives(optResult.alternatives);
      setValidation(optResult.validation);
      setHistoryVersions((prev) => [optResult.primarySchedule, ...prev.filter((v) => v.id !== optResult.primarySchedule.id)]);
    } catch (err) {
      console.error('Failed initial schedule optimization:', err);
    }
  };

  const handleSaveDaySettings = (newSettings: DaySettingsData) => {
    setDaySettings(newSettings);
    persistStateToLocalStorage(events, locations, newSettings);
    runInitialOptimization(events, locations, newSettings);
  };

  const handleAddEvent = async (newEvent: EventData) => {
    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    persistStateToLocalStorage(nextEvents, locations);
    runInitialOptimization(nextEvents, locations);

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
    } catch (err) {
      console.error('Failed to persist new event:', err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const nextEvents = events.filter((e) => e.id !== eventId);
    setEvents(nextEvents);
    persistStateToLocalStorage(nextEvents, locations);
    if (schedule) {
      setSchedule({
        ...schedule,
        items: schedule.items.filter((i) => i.event.id !== eventId),
      });
    }
    runInitialOptimization(nextEvents, locations);

    try {
      await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to persist event deletion:', err);
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventData) => {
    const nextEvents = events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setEvents(nextEvents);
    persistStateToLocalStorage(nextEvents, locations);
    runInitialOptimization(nextEvents, locations);

    try {
      await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });
    } catch (err) {
      console.error('Failed to persist event update:', err);
    }
  };

  const handleEditEvent = (evt: EventData) => {
    setEditingEvent(evt);
    setIsAddEventOpen(true);
  };

  const handleOptimizationComplete = (newSchedule: ScheduleData, newConflicts: string[]) => {
    setSchedule(newSchedule);
    setHistoryVersions((prev) => [newSchedule, ...prev]);
  };

  const handleSelectAlternative = (alt: ScheduleAlternative) => {
    setSchedule(alt.schedule);
    setHistoryVersions((prev) => [alt.schedule, ...prev.filter((v) => v.id !== alt.schedule.id)]);
  };

  const handleEmergencyOptimized = (newSchedule: ScheduleData, urgentEvent: EventData) => {
    setEvents((prev) => [urgentEvent, ...prev]);
    const emergencyVersion = { ...newSchedule, version: (schedule?.version || 1) + 1 };
    setSchedule(emergencyVersion);
    setHistoryVersions((prev) => [emergencyVersion, ...prev]);
  };

  // Live Execution Handlers
  const handleMarkArrived = () => {
    if (!schedule || schedule.items.length === 0) return;
    const activeIdx = schedule.items.findIndex((i) => i.execution?.status !== 'COMPLETED');
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    const updatedItems = [...schedule.items];
    updatedItems[targetIdx] = updateEventExecutionStatus(updatedItems[targetIdx], 'ARRIVED', '10:15');

    setSchedule({ ...schedule, items: updatedItems });
  };

  const handleMarkCompleted = () => {
    if (!schedule || schedule.items.length === 0) return;
    const activeIdx = schedule.items.findIndex((i) => i.execution?.status !== 'COMPLETED');
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    const updatedItems = [...schedule.items];

    updatedItems[targetIdx] = updateEventExecutionStatus(updatedItems[targetIdx], 'COMPLETED', '11:48');
    const delayAnalysis = calculateProjectedDelayImpact(updatedItems, 18);
    setSchedule({ ...schedule, items: delayAnalysis.projectedScheduleItems });
  };

  const handleSkipEvent = () => {
    if (!schedule || schedule.items.length === 0) return;
    const activeIdx = schedule.items.findIndex((i) => i.execution?.status !== 'COMPLETED');
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    const updatedItems = [...schedule.items];
    updatedItems[targetIdx] = updateEventExecutionStatus(updatedItems[targetIdx], 'SKIPPED', '10:15');

    setSchedule({ ...schedule, items: updatedItems });
  };

  const handleReoptimizeRemaining = () => {
    runInitialOptimization(events, locations);
  };

  const handleOpenContacts = (item: ScheduleItemData) => {
    setSelectedContactItem(item);
    setIsContactOpen(true);
  };

  const handleOpenDiagnostic = (evt: EventData) => {
    setDiagnosticEvent(evt);
    setIsDiagnosticOpen(true);
  };

  // V5 Lock & Handoff to V3 Live Execution
  const handleConfirmLock = () => {
    if (selectedV5Option) {
      setSchedule(selectedV5Option.schedule);
    }
    setIsLockModalOpen(false);
    setMode('LIVE_DAY');
    setActiveTab('WORKSPACE');
  };

  const activeItem = schedule?.items.find((i) => i.execution?.status !== 'COMPLETED');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans pb-16 lg:pb-0">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm overflow-x-auto gap-4">
        {/* Left Branding & Candidate */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">Magni Map</h1>

          <div className="h-5 w-px bg-slate-200 hidden md:block" />

          {/* Candidate Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 px-3 py-1 rounded-xl border border-slate-200/80">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="leading-tight">
              <h2 className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{campaign.candidateName}</h2>
              <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{campaign.constituency}</p>
            </div>
          </div>
        </div>

        {/* Center Main Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner shrink-0">
          <button
            onClick={() => setActiveTab('WORKSPACE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'WORKSPACE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('V5_SCHEDULING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'V5_SCHEDULING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Planner
          </button>
          <button
            onClick={() => setActiveTab('V6_LEARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'V6_LEARNING'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> Intelligence
          </button>
          <button
            onClick={() => setActiveTab('V7_PREDICTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'V7_PREDICTIVE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Predictive
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 hidden xl:flex ${
              activeTab === 'ANALYTICS'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Candidate Mobile PWA Link Button */}
          <a
            href="/live"
            target="_blank"
            className="px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm hidden sm:flex"
            title="Open Candidate Smartphone Mobile View"
          >
            <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>Mobile View</span>
          </a>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner hidden md:flex">
            <button
              onClick={() => setMode('PLANNING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mode === 'PLANNING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Planning
            </button>
            <button
              onClick={() => setMode('LIVE_DAY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                mode === 'LIVE_DAY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Live Day
            </button>
          </div>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>

          <button
            onClick={() => setIsOptimizeOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimize</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1700px] w-full mx-auto">
        {activeTab === 'ANALYTICS' ? (
          <CampaignAnalyticsView />
        ) : activeTab === 'V7_PREDICTIVE' ? (
          /* V7 PREDICTIVE CAMPAIGN INTELLIGENCE VIEW */
          <V7PredictiveDashboard
            onOpenWhatIfSimulator={() => setIsWhatIfModalOpen(true)}
          />
        ) : activeTab === 'V6_LEARNING' ? (
          /* V6 ADAPTIVE LEARNING PANEL VIEW */
          <V6AdaptiveLearningPanel
            onApplyLearningsToV5={() => {
              loadV5EngineData(events, locations);
              setActiveTab('V5_SCHEDULING');
            }}
          />
        ) : activeTab === 'V5_SCHEDULING' ? (
          /* V5 SMART CAMPAIGN SCHEDULING PLANNER VIEW */
          <div className="space-y-6">
            {/* Header Action Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Campaign Scheduler</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    Master Campaign Plan
                  </span>
                </div>
                <p className="text-xs text-slate-500">Multi-candidate Availability & Strategy Scoring Engine</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhatIfModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> What-If Simulator
                </button>

                <button
                  type="button"
                  onClick={() => setIsV5WizardOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Generate Smart Schedule
                </button>

                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-4 h-4" /> Lock & Hand Off to V3
                </button>
              </div>
            </div>

            {/* Plan Alternatives Comparison Cards */}
            {v5Data && (
              <ScheduleComparisonCard
                options={v5Data.options}
                selectedOptionId={selectedV5Option?.id || ''}
                onSelectOption={(opt) => setSelectedV5Option(opt)}
              />
            )}

            {/* Multi-Candidate Master Schedule Board */}
            {v5Data && (
              <MasterScheduleBoard
                scheduleOption={selectedV5Option}
                conflicts={v5Data.conflicts}
                onAutoFixConflict={(id) => console.log('Conflict resolved:', id)}
              />
            )}
          </div>
        ) : (
          /* WORKSPACE VIEW (V3 LIVE + V2 OPTIMIZED TIMELINE) */
          <>
            {/* Live Command Center (Visible in Live Day Mode) */}
            {mode === 'LIVE_DAY' && (
              <LiveCommandCenter
                status={liveStatus}
                activeItem={activeItem}
                onMarkArrived={handleMarkArrived}
                onMarkCompleted={handleMarkCompleted}
                onSkipEvent={handleSkipEvent}
                onReoptimizeRemaining={handleReoptimizeRemaining}
              />
            )}

            {/* Stats Metrics Grid */}
            <div className={`${mobileTab === 'stats' ? 'block' : 'hidden lg:grid'} grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`}>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Distance</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    {formatDistance(schedule?.totalDistanceMeters || 0)}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Matrix Calculated
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Driving Duration</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    {formatDuration(schedule?.totalTravelSeconds || 0)}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Traffic Aware Estimates
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Events Scheduled</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    {schedule?.items.length || 0} <span className="text-xs font-semibold text-slate-500">/ {events.length}</span>
                  </h3>
                  <p className="text-[10px] text-purple-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Building className="w-3 h-3" /> Feasibility Checked
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Geofence & Risk</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    {liveStatus?.geofence?.isInsideGeofence ? (
                      <span className="text-emerald-600">✓ At Venue</span>
                    ) : (
                      <span className="text-blue-600">En Route</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Radius: <span className="text-blue-600 font-bold">150m Auto-Geofence</span>
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>

            {/* Validation Alert */}
            {validation && validation.status !== 'FEASIBLE' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900">
                      Schedule Validation: {validation.eventsScheduled} / {validation.eventsRequested} Events Scheduled
                    </h4>
                    {validation.unassignedEvents.map(({ event, reason }, i) => (
                      <p key={i} className="text-xs text-amber-800">
                        • <strong>{event.title}</strong>: {reason}
                      </p>
                    ))}
                  </div>
                </div>

                {validation.unassignedEvents[0] && (
                  <button
                    onClick={() => handleOpenDiagnostic(validation.unassignedEvents[0].event)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Why Was This Missed?
                  </button>
                )}
              </div>
            )}

            {/* 3 Best Alternatives Comparison (Planning Mode) */}
            {mode === 'PLANNING' && (
              <AlternativeSchedulesCard
                alternatives={alternatives}
                activeProfile={schedule?.optimizationProfile || 'BALANCED'}
                onSelectAlternative={handleSelectAlternative}
              />
            )}

            {/* Main Workspace Pane (Split Desktop / Tabbed Mobile) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Pane (Timeline Schedule) */}
              <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'timeline' ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {mode === 'LIVE_DAY' ? 'Live Campaign Day Execution Timeline' : 'Daily Optimized Timeline'}
                      </h3>
                      <p className="text-xs text-slate-500">28 August 2026 • Guntur Constituency</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDaySettingsOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                        title="Configure Start & End Locations and Working Hours"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Start / End Settings</span>
                      </button>

                      <ScheduleVersionSelector
                        currentSchedule={schedule}
                        historyVersions={historyVersions}
                        onSelectVersion={(ver) => setSchedule(ver)}
                      />
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors hidden sm:block"
                        title="Export Schedule PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <ScheduleTimeline
                    items={schedule?.items || []}
                    selectedItemId={selectedItemId}
                    onSelectItem={(id) => setSelectedItemId(id)}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onOpenContacts={handleOpenContacts}
                    onAddEventClick={() => {
                      setEditingEvent(null);
                      setIsAddEventOpen(true);
                    }}
                    startLocation={locations.find((l) => l.id === daySettings.startLocationId) || locations[0] || null}
                    endLocation={locations.find((l) => l.id === daySettings.endLocationId) || locations[0] || null}
                    startTime={daySettings.startTime || '08:00'}
                    endTime={daySettings.endTime || '20:00'}
                  />
                </div>
              </div>

              {/* Right Pane (Interactive Map View) */}
              <div className={`lg:col-span-5 sticky top-20 ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" /> Route & Location Visualizer
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                      {locations.length} Stops
                    </span>
                  </div>

                  <div className="h-[420px] sm:h-[560px]">
                    <CampaignMap
                      locations={locations}
                      scheduleItems={schedule?.items || []}
                      selectedItemId={selectedItemId}
                      onSelectItem={(id) => setSelectedItemId(id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom View Switcher Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setMobileTab('timeline')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-4 rounded-xl transition-all ${
            mobileTab === 'timeline'
              ? 'text-blue-600 bg-blue-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-4 rounded-xl transition-all ${
            mobileTab === 'map'
              ? 'text-blue-600 bg-blue-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Map View</span>
        </button>

        <button
          onClick={() => setMobileTab('stats')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-4 rounded-xl transition-all ${
            mobileTab === 'stats'
              ? 'text-blue-600 bg-blue-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Metrics</span>
        </button>
      </div>

      {/* Modals */}
      <OptimizeModal
        isOpen={isOptimizeOpen}
        onClose={() => setIsOptimizeOpen(false)}
        locations={locations}
        onOptimizationComplete={handleOptimizationComplete}
      />

      <EventModal
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setEditingEvent(null);
        }}
        locations={locations}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        eventToEdit={editingEvent}
      />

      <DaySettingsModal
        isOpen={isDaySettingsOpen}
        onClose={() => setIsDaySettingsOpen(false)}
        locations={locations}
        currentSettings={daySettings}
        onSaveSettings={handleSaveDaySettings}
      />

      <EmergencyRescheduleModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        locations={locations}
        onEmergencyOptimized={handleEmergencyOptimized}
      />

      <RouteMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        locations={locations}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        event={selectedContactItem?.event || null}
      />

      <MissedEventDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        event={diagnosticEvent}
      />

      <SmartScheduleGeneratorWizard
        isOpen={isV5WizardOpen}
        onClose={() => setIsV5WizardOpen(false)}
        onGenerate={(st) => console.log('Generated with strategy:', st)}
      />

      <LockAndHandoffModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        scheduleOption={selectedV5Option}
        onConfirmLock={handleConfirmLock}
      />

      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
      />
    </div>
  );
}
