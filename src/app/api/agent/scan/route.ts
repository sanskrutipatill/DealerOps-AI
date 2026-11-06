import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const scanResults = await db.runInventoryIntelligenceScan();
    return NextResponse.json({
      success: true,
      data: scanResults,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

