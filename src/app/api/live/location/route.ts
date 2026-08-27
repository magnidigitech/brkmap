import { NextRequest, NextResponse } from 'next/server';
import { LiveLocationPing } from '@/types';

// In-memory candidate location store for real-time tracking
let LATEST_PING: LiveLocationPing = {
  candidateId: 'cand-1',
  latitude: 16.4420,
  longitude: 80.5540,
  accuracy: 8,
  speed: 12.5, // m/s (~45 km/h)
  heading: 140,
  timestamp: Date.now(),
};

const LOCATION_HISTORY: LiveLocationPing[] = [LATEST_PING];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, latitude, longitude, accuracy, speed, heading } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: 'Missing latitude/longitude' }, { status: 400 });
    }

    LATEST_PING = {
      id: `ping-${Date.now()}`,
      candidateId: candidateId || 'cand-1',
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : undefined,
      speed: speed ? Number(speed) : undefined,
      heading: heading ? Number(heading) : undefined,
      timestamp: Date.now(),
    };

    LOCATION_HISTORY.unshift(LATEST_PING);
    if (LOCATION_HISTORY.length > 50) LOCATION_HISTORY.pop();

    return NextResponse.json({
      success: true,
      ping: LATEST_PING,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to record location ping' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    latestPing: LATEST_PING,
    history: LOCATION_HISTORY.slice(0, 10),
  });
}
