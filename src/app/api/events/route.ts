import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import { EventData } from '@/types';

let inMemoryEvents: EventData[] = INITIAL_EVENTS.map((e) => ({
  ...e,
  location: INITIAL_LOCATIONS.find((l) => l.id === e.locationId),
}));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let filtered = inMemoryEvents;
  if (date) {
    filtered = inMemoryEvents.filter((e) => e.date === date);
  }

  return NextResponse.json({ success: true, events: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newEvent: EventData = {
      id: `evt-${Date.now()}`,
      campaignId: body.campaignId || 'cmp-guntur-2026',
      locationId: body.locationId,
      title: body.title,
      description: body.description || '',
      eventType: body.eventType || 'MEETING',
      date: body.date || '2026-08-28',
      preferredStart: body.preferredStart || null,
      preferredEnd: body.preferredEnd || null,
      fixedStart: body.fixedStart || null,
      fixedEnd: body.fixedEnd || null,
      durationMinutes: Number(body.durationMinutes) || 45,
      priority: Number(body.priority) || 50,
      isFixed: Boolean(body.isFixed),
      isFlexible: !body.isFixed,
      status: 'PLANNED',
      location: body.location,
    };

    inMemoryEvents.push(newEvent);
    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

  inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);
  return NextResponse.json({ success: true });
}
