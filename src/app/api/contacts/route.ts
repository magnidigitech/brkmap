import { NextRequest, NextResponse } from 'next/server';
import { CampaignContactData } from '@/types';

const MOCK_CONTACTS: CampaignContactData[] = [
  {
    id: 'cnt-1',
    eventId: 'evt-3',
    name: 'K. Ramesh (Weavers Association President)',
    phone: '+91 98480 12345',
    role: 'ORGANIZER',
    expectedCrowd: 1200,
    notes: 'Key community leader meeting at Mangalagiri Hall',
  },
  {
    id: 'cnt-2',
    eventId: 'evt-5',
    name: 'P. Srinivas (Tenali Town Campaign Incharge)',
    phone: '+91 99890 67890',
    role: 'COORDINATOR',
    expectedCrowd: 25000,
    notes: 'Tenali Stadium Mega Rally main contact',
  },
  {
    id: 'cnt-3',
    eventId: 'evt-4',
    name: 'M. Venkateswarlu (Tadikonda Sarpanch)',
    phone: '+91 94401 54321',
    role: 'ORGANIZER',
    expectedCrowd: 850,
    notes: 'Farmers gathering coordinator',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const filtered = MOCK_CONTACTS.filter((c) => c.eventId === eventId);
    return NextResponse.json({ success: true, contacts: filtered });
  }

  return NextResponse.json({ success: true, contacts: MOCK_CONTACTS });
}
