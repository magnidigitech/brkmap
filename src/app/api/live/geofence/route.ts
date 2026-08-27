import { NextRequest, NextResponse } from 'next/server';
import { evaluateGeofenceBoundary } from '@/lib/geo/geofence';
import { INITIAL_LOCATIONS } from '@/lib/db/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, targetLocationId } = body;

    const targetLoc = INITIAL_LOCATIONS.find((l) => l.id === targetLocationId) || INITIAL_LOCATIONS[0];

    const geofence = evaluateGeofenceBoundary(
      Number(latitude) || 16.3067,
      Number(longitude) || 80.4365,
      targetLoc,
      250 // 250m radius
    );

    return NextResponse.json({
      success: true,
      geofence,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Geofence evaluation failed' }, { status: 500 });
  }
}
