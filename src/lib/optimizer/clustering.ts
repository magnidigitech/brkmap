import { LocationData } from '@/types';
import { calculateHaversineDistance } from '../google/routes';

export interface LocationCluster {
  id: string;
  name: string;
  centroid: { latitude: number; longitude: number };
  locations: LocationData[];
}

export function clusterLocationsByProximity(
  locations: LocationData[],
  maxClusterRadiusMeters: number = 10000 // 10km radius
): LocationCluster[] {
  if (!locations || locations.length === 0) return [];

  const clusters: LocationCluster[] = [];

  locations.forEach((loc) => {
    let bestCluster: LocationCluster | null = null;
    let minDistance = Infinity;

    for (const cluster of clusters) {
      const dist = calculateHaversineDistance(
        loc.latitude,
        loc.longitude,
        cluster.centroid.latitude,
        cluster.centroid.longitude
      );

      if (dist <= maxClusterRadiusMeters && dist < minDistance) {
        minDistance = dist;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.locations.push(loc);
      // Recalculate cluster centroid
      const sumLat = bestCluster.locations.reduce((sum, l) => sum + l.latitude, 0);
      const sumLng = bestCluster.locations.reduce((sum, l) => sum + l.longitude, 0);
      bestCluster.centroid = {
        latitude: sumLat / bestCluster.locations.length,
        longitude: sumLng / bestCluster.locations.length,
      };
    } else {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        name: `Cluster ${clusters.length + 1} (${loc.name})`,
        centroid: { latitude: loc.latitude, longitude: loc.longitude },
        locations: [loc],
      });
    }
  });

  return clusters;
}
