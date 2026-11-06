import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'operations';
    const format = searchParams.get('format') || 'json';

    const metrics = await db.getOperationsMetrics();
    const vehicles = await db.getVehicles();
    const appointments = await db.getServiceAppointments();
    const followups = await db.getFollowUps();

    if (format === 'csv') {
      let csvContent = '';
      let filename = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`;

      if (type === 'inventory_aging') {
        csvContent = 'Stock Number,VIN,Brand,Model,Year,Status,Price,Purchase Cost,Days in Inventory,Holding Cost Est\n';
        vehicles.forEach((v) => {
          const days = v.days_in_inventory || 0;
          const holding = days * 24.5;
          csvContent += `"${v.stock_number}","${v.vin}","${v.brand}","${v.model}",${v.year},"${v.status}",${v.selling_price},${v.purchase_price},${days},${holding.toFixed(2)}\n`;
        });
      } else if (type === 'service') {
        csvContent = 'Appointment ID,Date,Time,Customer,Vehicle,Service Type,Bay,Advisor,Est Cost,Status\n';
        appointments.forEach((a) => {
          const cust = a.customer ? `${a.customer.first_name} ${a.customer.last_name}` : 'N/A';
          const veh = a.vehicle ? `${a.vehicle.year} ${a.vehicle.brand} ${a.vehicle.model}` : 'N/A';
          const adv = a.advisor ? a.advisor.full_name : 'Unassigned';
          csvContent += `"${a.id}","${a.appointment_date}","${a.time_slot}","${cust}","${veh}","${a.service_type}",${a.bay_number || ''},"${adv}",${a.estimated_cost},"${a.status}"\n`;
        });
      } else if (type === 'followups') {
        csvContent = 'FollowUp ID,Customer,Phone,Vehicle,Type,Priority,Due Date,Status,Channel\n';
        followups.forEach((f) => {
          const cust = f.customer ? `${f.customer.first_name} ${f.customer.last_name}` : 'N/A';
          const veh = f.vehicle ? `${f.vehicle.brand} ${f.vehicle.model}` : 'N/A';
          csvContent += `"${f.id}","${cust}","${f.customer?.phone || ''}","${veh}","${f.type}","${f.priority}","${f.due_date}","${f.status}","${f.channel}"\n`;
        });
      } else {
        // Daily / Monthly operations report
        csvContent = 'Category,Metric,Value\n';
        csvContent += `Inventory,Total Vehicles,${metrics.totalVehicles}\n`;
        csvContent += `Inventory,Available Inventory,${metrics.availableVehicles}\n`;
        csvContent += `Inventory,Vehicles Pending Service,${metrics.inServiceVehicles}\n`;
        csvContent += `Inventory,Average Inventory Age (Days),${metrics.avgInventoryAge}\n`;
        csvContent += `Inventory,Units > 60 Days,${metrics.agingOver60Days}\n`;
        csvContent += `Inventory,Units > 90 Days,${metrics.agingOver90Days}\n`;
        csvContent += `Valuation,Total Inventory Retail Value,${metrics.totalInventoryValue}\n`;
        csvContent += `Valuation,Total Acquisition Cost,${metrics.totalAcquisitionCost}\n`;
        csvContent += `Valuation,Potential Margin,${metrics.potentialMargin}\n`;
        csvContent += `Service,Upcoming Appointments,${metrics.upcomingAppointments}\n`;
        csvContent += `Service,Overdue Appointments,${metrics.overdueAppointments}\n`;
        csvContent += `Service,Service Throughput Rate (%),${metrics.serviceThroughputRate}%\n`;
        csvContent += `CRM,Overdue Follow-ups,${metrics.overdueFollowUps}\n`;
        csvContent += `Agent,Pending Approvals,${metrics.pendingAgentApprovals}\n`;
        csvContent += `Agent,Active Inventory Alerts,${metrics.activeAlertsCount}\n`;
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      metrics,
      totalVehiclesCount: vehicles.length,
      appointmentsCount: appointments.length,
      followupsCount: followups.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

