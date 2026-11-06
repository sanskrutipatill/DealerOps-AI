import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { VehicleStatus } from '@/types';

const VehicleCreateSchema = z.object({
  vin: z.string().min(11).max(17),
  stock_number: z.string().min(3),
  brand: z.string().min(2),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  trim: z.string().optional(),
  body_type: z.enum(['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Van', 'Wagon']),
  purchase_price: z.number().positive(),
  selling_price: z.number().positive(),
  mileage: z.number().nonnegative(),
  fuel_type: z.enum(['Gasoline', 'Hybrid', 'Electric', 'Diesel', 'Plug-in Hybrid']),
  transmission: z.enum(['Automatic', 'Manual', 'CVT', 'Dual-Clutch']),
  exterior_color: z.string().min(2),
  interior_color: z.string().optional(),
  inventory_date: z.string(),
  status: z.enum(['available', 'in_service', 'reserved', 'sold']).default('available'),
  location_bay: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as VehicleStatus) || undefined;
    const brand = searchParams.get('brand') || undefined;
    const fuel_type = searchParams.get('fuel_type') || undefined;
    const minAge = searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!, 10) : undefined;
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!, 10) : undefined;

    const vehicles = await db.getVehicles({
      search,
      status,
      brand,
      fuel_type,
      minAge,
      maxAge,
    });

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = VehicleCreateSchema.parse(body);
    const newVehicle = await db.createVehicle(validated);
    return NextResponse.json({ success: true, vehicle: newVehicle }, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

