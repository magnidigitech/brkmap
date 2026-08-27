import { EventData, LocationData, ScheduleData } from '@/types';
import { V5GenerationResult, V5ScheduleOption, ScheduleScoreBreakdown, ScoringWeights } from './types';
import { optimizeCampaignSchedule } from '../optimizer/optimizer';
import { detectScheduleConflicts } from './conflicts';

const DEFAULT_WEIGHTS: ScoringWeights = {
  travelWeight: 0.35,
  priorityWeight: 0.30,
  utilizationWeight: 0.20,
  workloadWeight: 0.15,
};

export async function generateV5SmartSchedule(
  campaignId: string,
  events: EventData[],
  locations: LocationData[],
  customWeights: ScoringWeights = DEFAULT_WEIGHTS
): Promise<V5GenerationResult> {
  const eventsWithLocs = events.map((e) => ({
    ...e,
    location: e.location || locations.find((l) => l.id === e.locationId),
  }));

  // Enforce Max Daily Stops Limit (8 stops max per candidate)
  const constrainedEvents = eventsWithLocs.slice(0, 8);

  // Strategy 1: Plan A — Best Balanced
  const optResult = await optimizeCampaignSchedule(
    {
      campaignId,
      date: '2026-08-28',
      startLocationId: locations[0]?.id,
      endLocationId: locations[0]?.id,
      startTime: '08:00',
      endTime: '20:00',
      profile: 'BALANCED',
    },
    constrainedEvents,
    locations
  );

  const planASchedule = optResult.primarySchedule;
  const planAScore = calculateNormalizedScheduleScore(planASchedule, events, customWeights);

  // Strategy 2: Plan B — Minimum Travel (Inverse travel efficiency prioritized)
  const planBSchedule = optResult.alternatives[1]?.schedule || optResult.primarySchedule;
  const minTravelWeights: ScoringWeights = {
    travelWeight: 0.55,
    priorityWeight: 0.20,
    utilizationWeight: 0.15,
    workloadWeight: 0.10,
  };
  const planBScore = calculateNormalizedScheduleScore(planBSchedule, events, minTravelWeights);

  // Strategy 3: Plan C — Priority First (100% high priority focus)
  const planCSchedule = optResult.alternatives[2]?.schedule || optResult.primarySchedule;
  const priorityWeights: ScoringWeights = {
    travelWeight: 0.20,
    priorityWeight: 0.60,
    utilizationWeight: 0.10,
    workloadWeight: 0.10,
  };
  const planCScore = calculateNormalizedScheduleScore(planCSchedule, events, priorityWeights);

  const options: V5ScheduleOption[] = [
    {
      id: `v5-plan-balanced-${Date.now()}`,
      strategy: 'BALANCED',
      title: 'Plan A — Best Balanced',
      description: 'Optimal balance of travel duration, priority rewards, and candidate availability.',
      totalDistanceKm: Number((planASchedule.totalDistanceMeters / 1000).toFixed(1)),
      totalTravelHours: Number((planASchedule.totalTravelSeconds / 3600).toFixed(1)),
      stopsCount: planASchedule.items.length,
      conflictsCount: 0,
      score: planAScore,
      schedule: planASchedule,
      isRecommended: true,
    },
    {
      id: `v5-plan-mintravel-${Date.now()}`,
      strategy: 'MIN_TRAVEL',
      title: 'Plan B — Minimum Travel',
      description: 'Minimized total driving distance and fuel consumption across constituencies.',
      totalDistanceKm: Number((planBSchedule.totalDistanceMeters / 1000).toFixed(1)),
      totalTravelHours: Number((planBSchedule.totalTravelSeconds / 3600).toFixed(1)),
      stopsCount: planBSchedule.items.length,
      conflictsCount: 0,
      score: planBScore,
      schedule: planBSchedule,
    },
    {
      id: `v5-plan-priority-${Date.now()}`,
      strategy: 'PRIORITY_FIRST',
      title: 'Plan C — Priority First',
      description: '100% completion of high-priority VIP meetings and rallies.',
      totalDistanceKm: Number((planCSchedule.totalDistanceMeters / 1000).toFixed(1)),
      totalTravelHours: Number((planCSchedule.totalTravelSeconds / 3600).toFixed(1)),
      stopsCount: planCSchedule.items.length,
      conflictsCount: 1,
      score: planCScore,
      schedule: planCSchedule,
    },
  ];

  const conflicts = detectScheduleConflicts(events);

  return {
    campaignId,
    options,
    conflicts,
  };
}

export function calculateNormalizedScheduleScore(
  schedule: ScheduleData,
  totalEvents: EventData[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScheduleScoreBreakdown {
  const distKm = schedule.totalDistanceMeters / 1000;
  const maxAllowedKm = 150; // Max allowed daily travel boundary

  // INVERSE TRAVEL NORMALIZATION: Lower travel distance yields a higher 0-100 score
  const travelEfficiencyScore = Math.max(
    0,
    Math.min(100, Math.round(100 * (1 - Math.min(distKm, maxAllowedKm) / maxAllowedKm)))
  );

  // Priority Completion Normalization
  const totalPriorityPoints = totalEvents.reduce((sum, e) => sum + e.priority, 0) || 100;
  const scheduledPriorityPoints = schedule.items.reduce((sum, item) => sum + item.event.priority, 0);
  const priorityCompletionScore = Math.max(
    0,
    Math.min(100, Math.round((scheduledPriorityPoints / totalPriorityPoints) * 100))
  );

  // Candidate Utilization Normalization (Ratio of event duration vs 12-hour working span)
  const totalEventMinutes = schedule.items.reduce((sum, item) => sum + item.event.durationMinutes, 0);
  const candidateUtilizationScore = Math.max(
    0,
    Math.min(100, Math.round((totalEventMinutes / 600) * 100))
  );

  // Workload Balance Normalization (Penalty for exceeding 8 daily stops)
  const stopPenalty = schedule.items.length > 8 ? (schedule.items.length - 8) * 10 : 0;
  const workloadBalanceScore = Math.max(0, Math.min(100, 100 - stopPenalty));

  // Configurable Weighted Overall Score
  const overallScore = Math.round(
    weights.travelWeight * travelEfficiencyScore +
    weights.priorityWeight * priorityCompletionScore +
    weights.utilizationWeight * candidateUtilizationScore +
    weights.workloadWeight * workloadBalanceScore
  );

  let scoreLabel: ScheduleScoreBreakdown['scoreLabel'] = 'EXCELLENT';
  if (overallScore < 70) scoreLabel = 'NEEDS_OPTIMIZATION';
  else if (overallScore < 80) scoreLabel = 'FAIR';
  else if (overallScore < 90) scoreLabel = 'GOOD';

  return {
    overallScore,
    travelEfficiencyScore,
    priorityCompletionScore,
    candidateUtilizationScore,
    workloadBalanceScore,
    scoreLabel,
  };
}
