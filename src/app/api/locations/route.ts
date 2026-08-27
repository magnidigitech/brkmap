import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import { searchPlaces } from '@/lib/google/places';
import { LocationData } from '@/types';

let inMemoryLocations: LocationData[] = [...INITIAL_LOCATIONS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const searchGoogle = searchParams.get('google') === 'true';

  if (searchGoogle && query) {
    const places = await searchPlaces(query);
    return NextResponse.json({ success: true, places });
  }

  if (query) {
    const filtered = inMemoryLocations.filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.address?.toLowerCase().includes(query.toLowerCase())
    );
    return NextResponse.json({ success: true, locations: filtered });
  }

  return NextResponse.json({ success: true, locations: inMemoryLocations });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newLocation: LocationData = {
      id: `loc-${Date.now()}`,
      campaignId: body.campaignId || 'cmp-guntur-2026',
      name: body.name,
      address: body.address || '',
      latitude: Number(body.latitude) || 16.3067,
      longitude: Number(body.longitude) || 80.4365,
      placeId: body.placeId || null,
      category: body.category || 'OTHER',
    };

    inMemoryLocations.push(newLocation);
    return NextResponse.json({ success: true, location: newLocation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create location' }, { status: 400 });
  }
}
