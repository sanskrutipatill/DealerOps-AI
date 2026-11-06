import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FollowUpStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as FollowUpStatus) || undefined;
    const priority = searchParams.get('priority') || undefined;
    const isOverdue = searchParams.get('isOverdue') === 'true';

    const followups = await db.getFollowUps({ status, priority, isOverdue });
    return NextResponse.json({ followups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, outcomeNote, draftMessage } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (draftMessage !== undefined) {
      await db.updateFollowUpDraft(id, draftMessage);
    }

    if (status) {
      const updated = await db.updateFollowUpStatus(id, status as FollowUpStatus, outcomeNote);
      return NextResponse.json({ success: true, followup: updated });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

