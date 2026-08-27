export interface RouteCalculationResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
}

export interface MatrixItemInput {
  id: string;
  latitude: number;
  longitude: number;
}

export interface MatrixCellResult {
  originId: string;
  destinationId: string;
  distanceMeters: number;
  durationSeconds: number;
}

// Calculate Haversine distance in meters
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  // Road factor multiplier (~1.35x for actual road winding distance vs straight line)
  return Math.round(straightDistance * 1.35);
}

// Estimate driving duration based on distance and average speed (35 km/h)
export function estimateDrivingDuration(distanceMeters: number): number {
  const avgSpeedMetersPerSec = (35 * 1000) / 3600; // ~9.72 m/s
  return Math.round(distanceMeters / avgSpeedMetersPerSec);
}

export async function computeRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<RouteCalculationResult> {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  const isKeyValid = serverKey && serverKey !== 'YOUR_GOOGLE_MAPS_SERVER_KEY' && serverKey.trim().length > 0;

  if (!isKeyValid) {
    const distanceMeters = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    const durationSeconds = estimateDrivingDuration(distanceMeters);
    return { distanceMeters, durationSeconds };
  }

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': serverKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.latitude, longitude: origin.longitude },
          },
        },
        destination: {
          location: {
            latLng: { latitude: destination.latitude, longitude: destination.longitude },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    });

    if (!response.ok) {
      console.warn('Routes API computeRoutes failed, returning estimated fallback');
      const dist = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      return { distanceMeters: dist, durationSeconds: estimateDrivingDuration(dist) };
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) {
      const dist = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      return { distanceMeters: dist, durationSeconds: estimateDrivingDuration(dist) };
    }

    const durationStr = route.duration || '0s';
    const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;

    return {
      distanceMeters: route.distanceMeters || 0,
      durationSeconds,
      polyline: route.polyline?.encodedPolyline,
    };
  } catch (error) {
    console.error('Error computing route via Routes API:', error);
    const dist = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    return { distanceMeters: dist, durationSeconds: estimateDrivingDuration(dist) };
  }
}

export async function computeRouteMatrix(
  locations: MatrixItemInput[]
): Promise<MatrixCellResult[]> {
  const results: MatrixCellResult[] = [];
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  const isKeyValid = serverKey && serverKey !== 'YOUR_GOOGLE_MAPS_SERVER_KEY' && serverKey.trim().length > 0;

  if (!isKeyValid || locations.length <= 1) {
    // Generate fallback matrix for all origin/destination pairs
    for (let i = 0; i < locations.length; i++) {
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          results.push({
            originId: locations[i].id,
            destinationId: locations[j].id,
            distanceMeters: 0,
            durationSeconds: 0,
          });
        } else {
          const dist = calculateHaversineDistance(
            locations[i].latitude,
            locations[i].longitude,
            locations[j].latitude,
            locations[j].longitude
          );
          results.push({
            originId: locations[i].id,
            destinationId: locations[j].id,
            distanceMeters: dist,
            durationSeconds: estimateDrivingDuration(dist),
          });
        }
      }
    }
    return results;
  }

  try {
    const origins = locations.map((loc) => ({
      waypoint: {
        location: {
          latLng: { latitude: loc.latitude, longitude: loc.longitude },
        },
      },
    }));

    const destinations = origins;

    const response = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': serverKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration,status',
      },
      body: JSON.stringify({
        origins,
        destinations,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    });

    if (!response.ok) {
      console.warn('Routes API computeRouteMatrix failed, fallback matrix generated');
      return computeRouteMatrixFallback(locations);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      for (const item of data) {
        const origIdx = item.originIndex ?? 0;
        const destIdx = item.destinationIndex ?? 0;
        const durationStr = item.duration || '0s';
        const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;

        results.push({
          originId: locations[origIdx].id,
          destinationId: locations[destIdx].id,
          distanceMeters: item.distanceMeters || 0,
          durationSeconds,
        });
      }
    }

    // Ensure matrix is complete for any missing indices
    for (let i = 0; i < locations.length; i++) {
      for (let j = 0; j < locations.length; j++) {
        const found = results.find((r) => r.originId === locations[i].id && r.destinationId === locations[j].id);
        if (!found) {
          const dist = i === j ? 0 : calculateHaversineDistance(locations[i].latitude, locations[i].longitude, locations[j].latitude, locations[j].longitude);
          results.push({
            originId: locations[i].id,
            destinationId: locations[j].id,
            distanceMeters: dist,
            durationSeconds: i === j ? 0 : estimateDrivingDuration(dist),
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error computing route matrix:', error);
    return computeRouteMatrixFallback(locations);
  }
}

function computeRouteMatrixFallback(locations: MatrixItemInput[]): MatrixCellResult[] {
  const results: MatrixCellResult[] = [];
  for (let i = 0; i < locations.length; i++) {
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        results.push({
          originId: locations[i].id,
          destinationId: locations[j].id,
          distanceMeters: 0,
          durationSeconds: 0,
        });
      } else {
        const dist = calculateHaversineDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
        results.push({
          originId: locations[i].id,
          destinationId: locations[j].id,
          distanceMeters: dist,
          durationSeconds: estimateDrivingDuration(dist),
        });
      }
    }
  }
  return results;
}
