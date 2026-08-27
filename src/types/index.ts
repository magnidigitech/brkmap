export interface LocationData {
  id: string;
  campaignId: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  placeId?: string | null;
  category: 'PARTY_OFFICE' | 'VILLAGE' | 'MEETING_HALL' | 'GOVERNMENT_OFFICE' | 'HOSPITAL' | 'TEMPLE' | 'MEDIA_LOCATION' | 'RESIDENCE' | 'PUBLIC_MEETING' | 'OTHER';
}

export interface CampaignContactData {
  id: string;
  eventId?: string;
  name: string;
  phone: string;
  role: 'ORGANIZER' | 'COORDINATOR' | 'SECURITY' | 'MEDIA' | 'DRIVER';
  notes?: string;
  expectedCrowd?: number;
}

export interface EventData {
  id: string;
  campaignId: string;
  locationId: string;
  title: string;
  description?: string | null;
  eventType: 'PUBLIC_MEETING' | 'VILLAGE_VISIT' | 'PRESS_CONF' | 'VIP_MEETING' | 'DOOR_TO_DOOR' | 'RALLY' | 'BREAK_REST' | 'MEETING' | 'TEMPLE';
  date: string; // YYYY-MM-DD
  preferredStart?: string | null; // HH:mm
  preferredEnd?: string | null; // HH:mm
  fixedStart?: string | null; // HH:mm
  fixedEnd?: string | null; // HH:mm
  durationMinutes: number;
  priority: number; // 1-100
  isFixed: boolean;
  isFlexible: boolean;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
  location?: LocationData;
  contacts?: CampaignContactData[];
}

export type GeofenceLifecycleState = 'SCHEDULED' | 'APPROACHING' | 'ARRIVED' | 'AT_EVENT' | 'COMPLETED' | 'DEPARTED';

export interface LiveLocationPing {
  id?: string;
  candidateId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface EventExecutionData {
  id: string;
  eventId: string;
  actualArrival?: string | null; // HH:mm
  actualStart?: string | null; // HH:mm
  actualEnd?: string | null; // HH:mm
  actualDurationMinutes?: number | null;
  delayMinutes: number; // +mins or -mins
  status: 'SCHEDULED' | 'APPROACHING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'DELAYED' | 'DEPARTED';
  notes?: string;
}

export interface GeofenceStatus {
  isInsideGeofence: boolean;
  distanceToVenueMeters: number;
  geofenceRadiusMeters: number;
  lifecycleState: GeofenceLifecycleState;
  autoTriggeredState?: 'AUTO_ARRIVED' | 'AUTO_DEPARTED' | null;
}

export interface DurationRecommendation {
  eventType: string;
  enteredMinutes: number;
  recommendedMinutes: number;
  historicalSampleCount: number;
  varianceMinutes: number;
}

export interface MissedEventDiagnostic {
  eventId: string;
  eventTitle: string;
  scheduledTime: string;
  totalImpactMinutes: number;
  breakdown: Array<{
    factor: string;
    impactMinutes: number;
  }>;
  recommendation: string;
}

export interface CampaignAnalyticsData {
  eventsPlanned: number;
  eventsCompleted: number;
  completionRatePercent: number;
  totalDistanceKm: number;
  totalDrivingHours: number;
  averageDelayMinutes: number;
  averageEventOverrunMinutes: number;
  scheduleAccuracyPercent: number;
  categoryStats: Array<{
    category: string;
    completed: number;
    total: number;
    avgDurationMinutes: number;
  }>;
}

export interface LiveCandidateStatus {
  candidateName: string;
  status: 'ON_ROAD' | 'AT_EVENT' | 'DELAYED' | 'COMPLETED';
  currentLocationName: string;
  currentLatitude: number;
  currentLongitude: number;
  nextEventId?: string;
  nextEventTitle?: string;
  scheduledArrival: string; // HH:mm
  liveEta: string; // HH:mm
  delayMinutes: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  geofence?: GeofenceStatus;
}

export interface ScheduleItemData {
  id: string;
  scheduleId: string;
  eventId: string;
  sequence: number;
  plannedArrival: string; // HH:mm
  plannedDeparture: string; // HH:mm
  travelDistanceMeters: number;
  travelSeconds: number;
  bufferSeconds: number;
  lateRiskScore: number;
  event: EventData;
  execution?: EventExecutionData;
}

export interface ScheduleData {
  id: string;
  campaignId: string;
  date: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  optimizationProfile: 'BALANCED' | 'MIN_TRAVEL_TIME' | 'MIN_DISTANCE' | 'MAX_EVENTS';
  totalDistanceMeters: number;
  totalTravelSeconds: number;
  totalBufferSeconds: number;
  items: ScheduleItemData[];
}

export interface ScheduleAlternative {
  profile: 'BALANCED' | 'MIN_TRAVEL_TIME' | 'MIN_DISTANCE' | 'MAX_EVENTS';
  title: string;
  description: string;
  totalDistanceMeters: number;
  totalTravelSeconds: number;
  totalBufferSeconds: number;
  eventsScheduledCount: number;
  totalEventsCount: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  schedule: ScheduleData;
}

export interface ScheduleValidationResult {
  status: 'FEASIBLE' | 'NEEDS_ATTENTION' | 'IMPOSSIBLE';
  eventsRequested: number;
  eventsScheduled: number;
  unassignedEvents: Array<{
    event: EventData;
    reason: string;
  }>;
  conflicts: string[];
  lateRiskScore: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CampaignData {
  id: string;
  name: string;
  candidateName: string;
  constituency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  timezone: string;
  locations?: LocationData[];
  events?: EventData[];
}

export interface RouteMatrixCell {
  originId: string;
  destinationId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export type OptimizationProfile = 'BALANCED' | 'MIN_TRAVEL_TIME' | 'MIN_DISTANCE' | 'MAX_EVENTS';

export interface OptimizeRequestInput {
  campaignId: string;
  date: string;
  startLocationId: string;
  endLocationId: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "20:00"
  profile: OptimizationProfile;
  eventIds?: string[];
}
