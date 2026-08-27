export interface DurationPredictionRange {
  eventType: string;
  minDurationMinutes: number;
  expectedDurationMinutes: number;
  maxDurationMinutes: number;
  sampleCount: number;
  confidencePercent: number;
  uncertaintyMarginMinutes: number;
  status: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
}

export interface TravelPredictionRange {
  corridorName: string;
  normalDurationMinutes: number;
  expectedDurationMinutes: number;
  highDelayDurationMinutes: number;
  trafficRiskProbability: number; // 0-100%
  peakWindow: string;
}

export interface DelayRiskProbability {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskPercent: number;
  confidencePercent: number;
  sampleCount: number;
  keyDrivers: string[];
}

export interface CandidateAdherenceProfile {
  candidateId: string;
  candidateName: string;
  onTimeArrivalRatePercent: number;
  averageOverrunMinutes: number;
  scheduleAdherenceScore: number; // 0-100
  historicalEventsCount: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CampaignRiskSummary {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedScheduleReliabilityPercent: number;
  warningFlagsCount: number;
  tightWindowsCount: number;
  limitedDataLocationsCount: number;
  eveningCongestionRoutesCount: number;
}

export interface WhatIfScenarioInput {
  type: 'CANDIDATE_UNAVAILABILITY' | 'TIME_SHIFT' | 'ROUTE_CONGESTION';
  targetCandidateId?: string;
  targetEventId?: string;
  newTimeWindow?: string;
}

export interface WhatIfSimulationResult {
  scenarioTitle: string;
  originalReliabilityPercent: number;
  simulatedReliabilityPercent: number;
  affectedStopsCount: number;
  additionalDistanceKm: number;
  expectedDelayMinutes: number;
  riskChangePercent: number; // e.g. +11%
  recommendedReplacementCandidate?: string;
  recommendedReplacementScore?: number;
  summaryRationale: string;
}

export interface V7PredictiveIntelligencePayload {
  durationPredictions: DurationPredictionRange[];
  travelPredictions: TravelPredictionRange[];
  delayRisk: DelayRiskProbability;
  candidateAdherence: CandidateAdherenceProfile[];
  campaignRisk: CampaignRiskSummary;
}
