import { NextRequest, NextResponse } from 'next/server';
import { updateEventExecutionStatus } from '@/lib/optimizer/execution';
import { ScheduleItemData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, item, time } = body;

    if (!action || !item) {
      return NextResponse.json({ success: false, error: 'Missing action or item' }, { status: 400 });
    }

    const currentTimeStr = time || '10:15';
    let statusType: any = 'SCHEDULED';
    if (action === 'MARK_ARRIVED') statusType = 'ARRIVED';
    if (action === 'MARK_COMPLETED') statusType = 'COMPLETED';
    if (action === 'SKIP_EVENT') statusType = 'SKIPPED';

    const updatedItem = updateEventExecutionStatus(item as ScheduleItemData, statusType, currentTimeStr);

    return NextResponse.json({
      success: true,
      action,
      updatedItem,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to execute live action' }, { status: 500 });
  }
}
