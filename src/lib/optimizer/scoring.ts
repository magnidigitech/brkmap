import { EventData, OptimizationProfile } from '@/types';

export interface ScoreWeights {
  travelTimeWeight: number;
  waitingTimeWeight: number;
  fixedViolationPenalty: number;
  priorityWeight: number;
  distanceWeight: number;
}

export function getProfileWeights(profile: OptimizationProfile): ScoreWeights {
  switch (profile) {
    case 'MIN_TRAVEL_TIME':
      return {
        travelTimeWeight: 3.0,
        waitingTimeWeight: 0.5,
        fixedViolationPenalty: 10000,
        priorityWeight: 1.0,
        distanceWeight: 0.5,
      };
    case 'MIN_DISTANCE':
      return {
        travelTimeWeight: 1.0,
        waitingTimeWeight: 0.5,
        fixedViolationPenalty: 10000,
        priorityWeight: 1.0,
        distanceWeight: 3.0,
      };
    case 'MAX_EVENTS':
      return {
        travelTimeWeight: 0.8,
        waitingTimeWeight: 0.2,
        fixedViolationPenalty: 10000,
        priorityWeight: 2.5,
        distanceWeight: 0.5,
      };
    case 'BALANCED':
    default:
      return {
        travelTimeWeight: 1.5,
        waitingTimeWeight: 0.5,
        fixedViolationPenalty: 10000,
        priorityWeight: 2.0,
        distanceWeight: 1.0,
      };
  }
}

export function calculateScheduleScore(
  totalTravelSeconds: number,
  totalBufferSeconds: number,
  totalDistanceMeters: number,
  eventsCompletedCount: number,
  totalEventsCount: number,
  totalPriorityEarned: number,
  fixedViolationsCount: number,
  profile: OptimizationProfile
): number {
  const weights = getProfileWeights(profile);

  const travelMinutes = totalTravelSeconds / 60;
  const bufferMinutes = totalBufferSeconds / 60;
  const distanceKm = totalDistanceMeters / 1000;

  // Cost component (lower is better)
  const cost =
    travelMinutes * weights.travelTimeWeight +
    bufferMinutes * weights.waitingTimeWeight +
    distanceKm * weights.distanceWeight +
    fixedViolationsCount * weights.fixedViolationPenalty;

  // Reward component (higher is better)
  const reward =
    eventsCompletedCount * 50 +
    totalPriorityEarned * weights.priorityWeight;

  return reward * 100 - cost;
}

export function calculateDynamicBufferMinutes(
  eventType: string,
  priority: number,
  travelMinutes: number,
  isFixed: boolean
): number {
  let baseBuffer = 10; // 10 minutes default base

  if (isFixed) {
    baseBuffer += 15; // Extra buffer before fixed event to guarantee punctual arrival
  }

  if (priority > 75) {
    baseBuffer += 10;
  }

  // Traffic risk buffer based on travel time
  if (travelMinutes > 45) {
    baseBuffer += 15;
  } else if (travelMinutes > 25) {
    baseBuffer += 10;
  }

  return baseBuffer;
}
