import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import { EventData } from '@/types';

const prisma = new PrismaClient();

let inMemoryEvents: EventData[] = INITIAL_EVENTS.map((e) => ({
  ...e,
  location: INITIAL_LOCATIONS.find((l) => l.id === e.locationId),
}));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const dbEvents = await prisma.event.findMany({
      include: { location: true },
    });

    if (dbEvents && dbEvents.length > 0) {
      const mapped: EventData[] = dbEvents.map((e) => ({
        id: e.id,
        campaignId: e.campaignId,
        locationId: e.locationId,
        title: e.title,
        description: e.description || '',
        eventType: e.eventType as any,
        date: e.date,
        preferredStart: e.preferredStart,
        preferredEnd: e.preferredEnd,
        fixedStart: e.fixedStart,
        fixedEnd: e.fixedEnd,
        durationMinutes: e.durationMinutes,
        priority: e.priority,
        isFixed: e.isFixed,
        isFlexible: e.isFlexible,
        status: e.status as any,
        location: e.location ? {
          id: e.location.id,
          campaignId: e.location.campaignId,
          name: e.location.name,
          address: e.location.address || '',
          latitude: e.location.latitude,
          longitude: e.location.longitude,
          placeId: e.location.placeId || undefined,
          category: e.location.category as any,
        } : undefined,
      }));

      const filtered = date ? mapped.filter((e) => e.date === date) : mapped;
      return NextResponse.json({ success: true, events: filtered });
    }
  } catch (err) {
    // Fallback to in-memory state
  }

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
      id: body.id || `evt-${Date.now()}`,
      campaignId: body.campaignId || 'cmp-ramakrishna-2026',
      locationId: body.locationId || INITIAL_LOCATIONS[0]?.id || 'loc-1',
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

    try {
      await prisma.event.create({
        data: {
          id: newEvent.id,
          campaignId: newEvent.campaignId,
          locationId: newEvent.locationId,
          title: newEvent.title,
          description: newEvent.description,
          eventType: newEvent.eventType,
          date: newEvent.date,
          preferredStart: newEvent.preferredStart,
          preferredEnd: newEvent.preferredEnd,
          fixedStart: newEvent.fixedStart,
          fixedEnd: newEvent.fixedEnd,
          durationMinutes: newEvent.durationMinutes,
          priority: newEvent.priority,
          isFixed: newEvent.isFixed,
          isFlexible: newEvent.isFlexible,
          status: newEvent.status,
        },
      });
    } catch (dbErr) {
      console.warn('Database save warning, retained in memory');
    }

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const updatedEvent: EventData = {
      id,
      campaignId: body.campaignId || 'cmp-ramakrishna-2026',
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
      status: body.status || 'PLANNED',
      location: body.location,
    };

    inMemoryEvents = inMemoryEvents.map((e) => (e.id === id ? updatedEvent : e));

    try {
      await prisma.event.update({
        where: { id },
        data: {
          title: updatedEvent.title,
          description: updatedEvent.description,
          eventType: updatedEvent.eventType,
          locationId: updatedEvent.locationId,
          durationMinutes: updatedEvent.durationMinutes,
          priority: updatedEvent.priority,
          isFixed: updatedEvent.isFixed,
          isFlexible: updatedEvent.isFlexible,
          fixedStart: updatedEvent.fixedStart,
          fixedEnd: updatedEvent.fixedEnd,
        },
      });
    } catch (dbErr) {
      console.warn('Database update warning, retained in memory');
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

  inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);

  try {
    await prisma.event.delete({
      where: { id },
    });
  } catch (dbErr) {
    // Database delete fallback
  }

  return NextResponse.json({ success: true });
}
