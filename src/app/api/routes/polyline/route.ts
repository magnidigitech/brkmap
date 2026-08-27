import { NextRequest, NextResponse } from 'next/server';
import { computeRoute } from '@/lib/google/routes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { points } = body as { points: Array<{ latitude: number; longitude: number }> };

    if (!points || !Array.isArray(points) || points.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 points required' }, { status: 400 });
    }

    const polylines: string[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const routeRes = await computeRoute(points[i], points[i + 1]);
      if (routeRes.polyline) {
        polylines.push(routeRes.polyline);
      }
    }

    return NextResponse.json({
      success: true,
      polylines,
    });
  } catch (error) {
    console.error('Error fetching route polylines:', error);
    return NextResponse.json({ success: false, error: 'Polyline computation failed' }, { status: 500 });
  }
}
