import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const actions = await db.getAgentActions({ status });
    return NextResponse.json({ actions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionId, decision } = body; // decision: 'approve' | 'reject'

    if (!actionId || !decision) {
      return NextResponse.json({ error: 'actionId and decision are required.' }, { status: 400 });
    }

    const activeProfile = await db.getActiveProfile();

    if (decision === 'approve') {
      const res = await db.approveAgentAction(actionId, activeProfile.id);
      return NextResponse.json(res);
    } else if (decision === 'reject') {
      const success = await db.rejectAgentAction(actionId, activeProfile.id);
      return NextResponse.json({ success, message: 'Action rejected by manager.' });
    } else {
      return NextResponse.json({ error: 'Invalid decision type.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

