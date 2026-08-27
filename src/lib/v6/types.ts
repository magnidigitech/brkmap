export interface DurationPatternModel {
  eventType: string;
  plannedAvgMinutes: number;
  actualAvgMinutes: number;
  trimmedMeanMinutes: number;
  overrunMinutes: number;
  sampleCount: number;
  reliabilityConfidence: number; // Data Confidence Score (heuristic reliability based on N)
  recommendedBufferMinutes: number;
  status: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
  methodology: string;
}

export interface TimeWindowCorridor {
  timeWindow: string; // e.g. "16:00–18:00"
  corridorName: string;
  originCategory: string;
  destinationCategory: string;
  sampleCount: number;
  expectedTravelMinutes: number;
  actualTravelMinutes: number;
  averageDelayMinutes: number;
  peakHourRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reliabilityScorePercent: number;
}

export interface AdaptiveBufferRecommendation {
  id: string;
  title: string;
  category: string;
  currentBufferMinutes: number;
  recommendedBufferMinutes: number;
  rationale: string;
  sampleCount: number;
  impactScoreImprovement: number;
}

export interface V6LearningInsights {
  overallExecutionAccuracyPercent: number;
  totalEventsAnalyzed: number;
  averageOverrunMinutes: number;
  durationPatterns: DurationPatternModel[];
  routeCorridors: TimeWindowCorridor[];
  recommendations: AdaptiveBufferRecommendation[];
  methodologyNotice: string;
}
