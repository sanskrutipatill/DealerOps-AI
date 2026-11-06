import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus, ServiceTimeSlot } from '@/types';

const AppointmentCreateSchema = z.object({
  customer_id: z.string().min(1),
  vehicle_id: z.string().min(1),
  assigned_advisor_id: z.string().optional(),
  service_type: z.string().min(2),
  appointment_date: z.string(),
  time_slot: z.enum([
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
  ]),
  bay_number: z.number().int().min(1).max(12).optional(),
  estimated_duration_hours: z.number().positive().default(1.5),
  estimated_cost: z.number().nonnegative().default(150),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue']).default('scheduled'),
  service_notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const status = (searchParams.get('status') as AppointmentStatus) || undefined;
    const advisor_id = searchParams.get('advisor_id') || undefined;

    const appointments = await db.getServiceAppointments({ date, status, advisor_id });
    return NextResponse.json({ appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if client is doing a dry-run conflict check
    if (body.action === 'check_conflict') {
      const conflictResult = await db.checkAppointmentConflict({
        appointment_date: body.appointment_date,
        time_slot: body.time_slot as ServiceTimeSlot,
        assigned_advisor_id: body.assigned_advisor_id,
        bay_number: body.bay_number,
      });
      return NextResponse.json(conflictResult);
    }

    const validated = AppointmentCreateSchema.parse(body);
    const result = await db.createServiceAppointment(validated);

    if (!result.success) {
      return NextResponse.json({ error: result.error, conflict: true }, { status: 409 });
    }

    return NextResponse.json({ success: true, appointment: result.appointment }, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const updated = await db.updateAppointmentStatus(id, status as AppointmentStatus, notes);
    if (!updated) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

