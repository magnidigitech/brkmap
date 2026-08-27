import { GeofenceLifecycleState, GeofenceStatus, LocationData } from '@/types';
import { calculateHaversineDistance } from '../google/routes';

export function evaluateGeofenceBoundary(
  currentLat: number,
  currentLng: number,
  targetLocation: LocationData,
  geofenceRadiusMeters: number = 150 // 150m radius per V4-2.MD
): GeofenceStatus {
  const distMeters = calculateHaversineDistance(
    currentLat,
    currentLng,
    targetLocation.latitude,
    targetLocation.longitude
  );

  const isInside = distMeters <= geofenceRadiusMeters;

  let lifecycleState: GeofenceLifecycleState = 'SCHEDULED';
  if (isInside) {
    lifecycleState = 'ARRIVED';
  } else if (distMeters <= 500) {
    lifecycleState = 'APPROACHING';
  } else if (distMeters > geofenceRadiusMeters * 2) {
    lifecycleState = 'DEPARTED';
  }

  let autoTriggeredState: GeofenceStatus['autoTriggeredState'] = null;
  if (isInside) {
    autoTriggeredState = 'AUTO_ARRIVED';
  } else if (distMeters > geofenceRadiusMeters * 2) {
    autoTriggeredState = 'AUTO_DEPARTED';
  }

  return {
    isInsideGeofence: isInside,
    distanceToVenueMeters: distMeters,
    geofenceRadiusMeters,
    lifecycleState,
    autoTriggeredState,
  };
}
