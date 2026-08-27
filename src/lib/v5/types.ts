import { EventData, LocationData, ScheduleData } from '@/types';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED' | 'BLOCKED';

export interface CandidateAvailabilityData {
  id: string;
  candidateId: string;
  candidateName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AvailabilityStatus;
  notes?: string;
}

export interface CandidatePreferenceData {
  candidateId: string;
  maxDailyStops: number;
  maxDailyTravelKm: number;
  preferredCategories: string[];
}

export interface SchedulingConstraintData {
  id: string;
  campaignId: string;
  type: 'WORKING_HOURS' | 'MAX_DAILY_STOPS' | 'MAX_TRAVEL_DISTANCE' | 'MIN_BUFFER' | 'REQUIRED_LOCATION';
  severity: 'HARD' | 'SOFT';
  value: string | number;
  enabled: boolean;
}

export interface ScoringWeights {
  travelWeight: number; // default: 0.35
  priorityWeight: number; // default: 0.30
  utilizationWeight: number; // default: 0.20
  workloadWeight: number; // default: 0.15
}

export interface ScheduleScoreBreakdown {
  overallScore: number; // 0-100
  travelEfficiencyScore: number; // 0-100 (normalized: lower distance = higher score)
  priorityCompletionScore: number; // 0-100
  candidateUtilizationScore: number; // 0-100
  workloadBalanceScore: number; // 0-100
  scoreLabel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_OPTIMIZATION';
}

export interface ConflictResolution {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  suggestedCandidateId?: string;
  suggestedCandidateName?: string;
  suggestedAction: string;
  impactLabel: string;
}

export interface V5ScheduleOption {
  id: string;
  strategy: 'MIN_TRAVEL' | 'BALANCED' | 'PRIORITY_FIRST' | 'MAX_COVERAGE';
  title: string;
  description: string;
  totalDistanceKm: number;
  totalTravelHours: number;
  stopsCount: number;
  conflictsCount: number;
  score: ScheduleScoreBreakdown;
  schedule: ScheduleData;
  isRecommended?: boolean;
}

export interface V5GenerationResult {
  campaignId: string;
  options: V5ScheduleOption[];
  conflicts: ConflictResolution[];
}
