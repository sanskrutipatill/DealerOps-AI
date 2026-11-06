import { NextRequest, NextResponse } from 'next/server';
import { processAgentQuery } from '@/lib/gemini';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'A query string is required.' }, { status: 400 });
    }

    // Record agent activity in database audit log
    await db.recordActivityLog('agent', 'query_received', { query });

    const response = await processAgentQuery(query);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while processing query.' },
      { status: 500 }
    );
  }
}

