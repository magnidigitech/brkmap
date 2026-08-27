import { NextRequest, NextResponse } from 'next/server';
import { lockMasterScheduleInDb, saveScheduleVersionToDb } from '@/lib/v5/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, campaignId, schedule } = body;

    const targetId = scheduleId || 'sch-v5-locked';
    const dbLock = await lockMasterScheduleInDb(targetId);

    if (schedule) {
      await saveScheduleVersionToDb(
        campaignId || 'cmp-1',
        { ...schedule, status: 'LOCKED' },
        'V5 Master Plan Approved & Handed off to V3 Live Execution'
      );
    }

    return NextResponse.json({
      success: true,
      message: 'V5 Campaign Schedule successfully locked, persisted, and handed off to V3 Execution Engine.',
      lockedScheduleId: dbLock?.id || targetId,
      status: 'LOCKED',
      handOffTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to lock V5 schedule' }, { status: 500 });
  }
}
