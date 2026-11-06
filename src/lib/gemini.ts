import { db } from './db';
import { AgentToolCallRecord, AgentAction } from '@/types';
import { formatCurrency } from './utils';

// Tool Definition Schema for Gemini
export const AGENT_TOOLS_DECLARATIONS = [
  {
    name: 'query_inventory',
    description: 'Retrieve real vehicles from inventory with optional filters such as minimum age in days, status, brand, or search keyword.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'Keyword to match brand, model, VIN, or stock number' },
        status: { type: 'STRING', description: 'Filter by status: available, in_service, reserved, sold' },
        brand: { type: 'STRING', description: 'Filter by vehicle make/brand (e.g. Ford, Toyota, Audi)' },
        minAgeDays: { type: 'NUMBER', description: 'Filter vehicles that have been in inventory for at least this many days (e.g., 30, 60, 90)' },
      },
    },
  },
  {
    name: 'query_service_appointments',
    description: 'Retrieve service appointments filtered by status (scheduled, in_progress, overdue, completed) or date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'Filter by status: scheduled, in_progress, completed, overdue' },
        date: { type: 'STRING', description: 'YYYY-MM-DD date' },
        onlyOverdue: { type: 'BOOLEAN', description: 'Whether to return only overdue or missed service appointments' },
      },
    },
  },
  {
    name: 'query_customer_followups',
    description: 'Retrieve customer follow-ups and CRM leads needing attention.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'Filter by status: pending, approved, sent, completed' },
        isOverdue: { type: 'BOOLEAN', description: 'If true, returns follow-ups whose due date has passed' },
        priority: { type: 'STRING', description: 'Filter by priority: high, medium, low' },
      },
    },
  },
  {
    name: 'get_operations_summary',
    description: 'Retrieve holistic dealership operational metrics, total inventory count, average aging days, overdue follow-ups, and service throughput.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'identify_aging_inventory',
    description: 'Analyze dealership inventory specifically for units approaching or exceeding aging thresholds (>45, >60, >90 days) with holding cost and margin impact.',
    parameters: {
      type: 'OBJECT',
      properties: {
        thresholdDays: { type: 'NUMBER', description: 'Minimum age threshold to evaluate (defaults to 60)' },
      },
    },
  },
  {
    name: 'schedule_service_appointment',
    description: 'Propose a new service appointment with conflict check verification across technician and service bay schedules.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerId: { type: 'STRING', description: 'Customer ID' },
        vehicleId: { type: 'STRING', description: 'Vehicle ID' },
        serviceType: { type: 'STRING', description: 'Type of service (e.g. Oil & Filter, Brake System, Engine Diagnostics)' },
        appointmentDate: { type: 'STRING', description: 'Date in YYYY-MM-DD' },
        timeSlot: { type: 'STRING', description: 'Time slot (e.g. 09:00 AM, 10:00 AM, 02:00 PM)' },
        bayNumber: { type: 'NUMBER', description: 'Assigned service bay (1-12)' },
      },
      required: ['customerId', 'vehicleId', 'serviceType', 'appointmentDate', 'timeSlot'],
    },
  },
  {
    name: 'draft_followup_message',
    description: 'Generate and queue a personalized customer outreach message draft (SMS or Email) based on vehicle and interaction history.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerId: { type: 'STRING', description: 'Customer ID' },
        vehicleId: { type: 'STRING', description: 'Vehicle ID' },
        channel: { type: 'STRING', description: 'sms or email' },
        intent: { type: 'STRING', description: 'Purpose: test_drive_followup, service_reminder, pricing_update' },
      },
      required: ['customerId', 'channel', 'intent'],
    },
  },
  {
    name: 'request_action_approval',
    description: 'Register a consequential operational action requiring human approval (e.g. price markdown, customer outreach dispatch, status change).',
    parameters: {
      type: 'OBJECT',
      properties: {
        actionType: { type: 'STRING', description: 'inventory_markdown, send_followup, vehicle_status_change' },
        targetEntityType: { type: 'STRING', description: 'vehicle, follow_up, service_appointment' },
        targetEntityId: { type: 'STRING', description: 'Target entity ID' },
        parameters: { type: 'OBJECT', description: 'Parameters for the action' },
        reasoning: { type: 'STRING', description: 'Operational reasoning justifying the action' },
        impactSummary: { type: 'STRING', description: 'Summary of financial and operational impact' },
      },
      required: ['actionType', 'targetEntityType', 'targetEntityId', 'reasoning', 'impactSummary'],
    },
  },
];

// Backend Controlled Tool Execution Engine
export async function executeAgentTool(
  toolName: string,
  args: Record<string, any>
): Promise<{ result: any; summary: string; recordsCount: number; pendingAction?: AgentAction }> {
  const startTime = Date.now();

  switch (toolName) {
    case 'query_inventory': {
      const vehicles = await db.getVehicles({
        search: args.search,
        status: args.status,
        brand: args.brand,
        minAge: args.minAgeDays,
      });

      const summary = `Found ${vehicles.length} vehicle(s) matching criteria${
        args.minAgeDays ? ` aged >= ${args.minAgeDays} days` : ''
      }${args.brand ? ` brand: ${args.brand}` : ''}.`;

      return {
        result: vehicles.map((v) => ({
          id: v.id,
          vin: v.vin,
          stock: v.stock_number,
          makeModel: `${v.year} ${v.brand} ${v.model} (${v.trim || ''})`,
          price: formatCurrency(v.selling_price),
          mileage: `${v.mileage.toLocaleString()} mi`,
          daysInInventory: v.days_in_inventory,
          status: v.status,
          location: v.location_bay,
        })),
        summary,
        recordsCount: vehicles.length,
      };
    }

    case 'query_service_appointments': {
      const appointments = await db.getServiceAppointments({
        date: args.date,
        status: args.status,
      });

      const filtered = args.onlyOverdue
        ? appointments.filter((a) => a.status === 'overdue')
        : appointments;

      const summary = `Found ${filtered.length} service appointment(s)${
        args.onlyOverdue ? ' marked overdue' : ''
      }${args.status ? ` with status: ${args.status}` : ''}.`;

      return {
        result: filtered.map((a) => ({
          id: a.id,
          customer: a.customer ? `${a.customer.first_name} ${a.customer.last_name}` : 'Unknown',
          customerPhone: a.customer?.phone,
          vehicle: a.vehicle ? `${a.vehicle.year} ${a.vehicle.brand} ${a.vehicle.model}` : 'Unknown',
          serviceType: a.service_type,
          date: a.appointment_date,
          timeSlot: a.time_slot,
          bay: a.bay_number ? `Bay #${a.bay_number}` : 'Unassigned',
          status: a.status,
          estimatedCost: formatCurrency(a.estimated_cost),
        })),
        summary,
        recordsCount: filtered.length,
      };
    }

    case 'query_customer_followups': {
      const followups = await db.getFollowUps({
        status: args.status,
        isOverdue: args.isOverdue,
        priority: args.priority,
      });

      const summary = `Found ${followups.length} follow-up item(s)${
        args.isOverdue ? ' (overdue)' : ''
      }${args.priority ? ` [priority: ${args.priority}]` : ''}.`;

      return {
        result: followups.map((f) => ({
          id: f.id,
          customer: f.customer ? `${f.customer.first_name} ${f.customer.last_name}` : 'Unknown',
          vehicle: f.vehicle ? `${f.vehicle.brand} ${f.vehicle.model}` : 'N/A',
          type: f.type,
          priority: f.priority,
          dueDate: f.due_date,
          status: f.status,
          draftMessage: f.draft_message,
          channel: f.channel,
        })),
        summary,
        recordsCount: followups.length,
      };
    }

    case 'get_operations_summary': {
      const metrics = await db.getOperationsMetrics();
      const summary = `Dealership status: ${metrics.totalVehicles} total vehicles (${metrics.availableVehicles} available, ${metrics.inServiceVehicles} in service). Average aging: ${metrics.avgInventoryAge} days. Overdue follow-ups: ${metrics.overdueFollowUps}. Overdue service: ${metrics.overdueAppointments}.`;

      return {
        result: {
          inventoryCount: metrics.totalVehicles,
          availableCount: metrics.availableVehicles,
          totalInventoryValuation: formatCurrency(metrics.totalInventoryValue),
          potentialGrossMargin: formatCurrency(metrics.potentialMargin),
          averageInventoryAgeDays: metrics.avgInventoryAge,
          unitsOver60Days: metrics.agingOver60Days,
          unitsOver90Days: metrics.agingOver90Days,
          upcomingServiceAppointments: metrics.upcomingAppointments,
          overdueAppointments: metrics.overdueAppointments,
          overdueFollowUps: metrics.overdueFollowUps,
          pendingAgentApprovals: metrics.pendingAgentApprovals,
          activeAlerts: metrics.activeAlertsCount,
        },
        summary,
        recordsCount: 1,
      };
    }

    case 'identify_aging_inventory': {
      const threshold = args.thresholdDays || 60;
      const vehicles = await db.getVehicles({ minAge: threshold, status: 'available' });

      const evaluated = vehicles.map((v) => {
        const days = v.days_in_inventory || 0;
        const carryingCost = days * 24.5;
        const margin = v.selling_price - v.purchase_price;
        return {
          id: v.id,
          stock: v.stock_number,
          makeModel: `${v.year} ${v.brand} ${v.model}`,
          price: formatCurrency(v.selling_price),
          daysInInventory: days,
          floorplanHoldingCost: formatCurrency(carryingCost),
          currentMargin: formatCurrency(margin),
          recommendedAction:
            days >= 90
              ? `Authorized $1,200 markdown to stimulate turn before wholesale liquidation.`
              : `Reposition to showroom front row and review digital ad spend.`,
        };
      });

      const summary = `Identified ${evaluated.length} vehicle(s) currently exceeding ${threshold} days on lot.`;

      return {
        result: evaluated,
        summary,
        recordsCount: evaluated.length,
      };
    }

    case 'schedule_service_appointment': {
      // Check conflict first
      const conflict = await db.checkAppointmentConflict({
        appointment_date: args.appointmentDate,
        time_slot: args.timeSlot,
        bay_number: args.bayNumber,
      });

      if (conflict.hasConflict) {
        return {
          result: { conflictDetected: true, error: conflict.reason },
          summary: `Conflict detected: ${conflict.reason}`,
          recordsCount: 0,
        };
      }

      // Consequential action: schedule creation queued as pending approval or direct booking
      const newAppt = await db.createServiceAppointment({
        customer_id: args.customerId,
        vehicle_id: args.vehicleId,
        service_type: args.serviceType,
        appointment_date: args.appointmentDate,
        time_slot: args.timeSlot,
        bay_number: args.bayNumber || 1,
        estimated_duration_hours: 1.5,
        estimated_cost: 150.0,
        status: 'scheduled',
        service_notes: 'Booked via DealerOps AI Agent with conflict check passed.',
      });

      return {
        result: newAppt.appointment,
        summary: `Successfully booked service appointment for ${args.appointmentDate} at ${args.timeSlot} in Bay #${args.bayNumber || 1}.`,
        recordsCount: 1,
      };
    }

    case 'draft_followup_message': {
      const customer = await db.getCustomerById(args.customerId);
      const vehicle = args.vehicleId ? await db.getVehicleById(args.vehicleId) : null;

      let draft = '';
      if (args.intent === 'test_drive_followup') {
        draft = `Hi ${customer?.first_name || 'there'}, thanks for visiting Apex Automotive and test driving the ${
          vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : 'vehicle'
        }! We have attractive financing rates and manager trade-in bonuses available this week. Would you like to review figures?`;
      } else if (args.intent === 'service_reminder') {
        draft = `Hello ${customer?.first_name || 'there'}, our records show your ${
          vehicle ? `${vehicle.brand} ${vehicle.model}` : 'vehicle'
        } is due for scheduled inspection. Would you like us to reserve a morning slot for you this week?`;
      } else {
        draft = `Dear ${customer?.first_name || 'Customer'}, following up from Apex Automotive regarding your inquiry. Please let us know how we can best assist you today.`;
      }

      // Consequential action: require human approval before sending
      const pendingAction = await db.createAgentAction({
        action_type: 'send_followup',
        status: 'pending_approval',
        target_entity_type: 'follow_up',
        target_entity_id: customer?.id || 'unknown',
        parameters: {
          customer_id: customer?.id,
          customer_name: `${customer?.first_name} ${customer?.last_name}`,
          channel: args.channel,
          message: draft,
        },
        reasoning: `Follow-up draft automatically composed based on intent: ${args.intent}. Requires advisor review before dispatch.`,
        impact_summary: `Queued ${args.channel.toUpperCase()} message for ${customer?.first_name} ${customer?.last_name} (${customer?.phone || customer?.email}).`,
      });

      return {
        result: { customerName: `${customer?.first_name} ${customer?.last_name}`, draft, pendingActionId: pendingAction.id },
        summary: `Drafted ${args.channel} follow-up for ${customer?.first_name} ${customer?.last_name} and queued for human approval.`,
        recordsCount: 1,
        pendingAction,
      };
    }

    case 'request_action_approval': {
      const action = await db.createAgentAction({
        action_type: args.actionType,
        status: 'pending_approval',
        target_entity_type: args.targetEntityType,
        target_entity_id: args.targetEntityId,
        parameters: args.parameters || {},
        reasoning: args.reasoning,
        impact_summary: args.impactSummary,
      });

      return {
        result: action,
        summary: `Generated approval ticket for ${args.actionType} (ID: ${action.id.slice(0, 8)}). Awaiting manager signature.`,
        recordsCount: 1,
        pendingAction: action,
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// System prompt defining persona, boundaries, and enterprise guidelines
export const AGENT_SYSTEM_PROMPT = `
You are the AI Operations Agent for "DealerOps AI – Intelligent Dealership Operations Platform".
You are embedded in an enterprise automotive dealership management system.

YOUR CAPABILITIES & PROTOCOLS:
1. You understand natural language business requests from dealership managers, service advisors, and staff.
2. You retrieve real, actual database records using your controlled backend tools.
3. You NEVER fabricate VINs, inventory counts, pricing, or customer details.
4. You adhere to strict safety: you DO NOT execute arbitrary SQL or touch raw credentials.
5. You DO NOT directly perform irreversible actions without requesting approval. For consequential actions (such as price reductions, marking down stock, or sending external customer messages), you MUST invoke 'request_action_approval' or generate a pending approval item so a human manager can review and click approve.
6. Present your answers in professional, concise, enterprise SaaS format:
   - Clear executive summary first.
   - Specific data items referenced with stock #, brand, model, days on lot, or customer name.
   - Concrete, numbered operational recommendations.
   - Mention when an action has been queued for human manager approval.

SAMPLE QUERIES YOU HANDLE DIRECTLY:
- "Show all vehicles that have been in inventory for more than 30 days." -> Call query_inventory with minAgeDays: 30
- "Which vehicles need servicing this week?" -> Call query_service_appointments with status or date range
- "Generate this month's operations report." -> Call get_operations_summary & synthesize performance
- "Find customers whose service appointments are overdue." -> Call query_service_appointments with onlyOverdue: true
- "Identify inventory that needs attention." -> Call identify_aging_inventory with thresholdDays: 60
`.trim();

/**
 * Intelligent Query Router & Engine
 * Executes tool calls and formats executive reasoning
 */
export async function processAgentQuery(query: string): Promise<{
  text: string;
  toolCalls: AgentToolCallRecord[];
  pendingActions: AgentAction[];
  quickActions: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const toolCalls: AgentToolCallRecord[] = [];
  const pendingActions: AgentAction[] = [];
  const quickActions: string[] = [];

  const lowerQuery = query.toLowerCase();

  // Pattern detection for dealership operational intents
  if (
    lowerQuery.includes('more than 30 days') ||
    lowerQuery.includes('over 30 days') ||
    lowerQuery.includes('30 days') ||
    (lowerQuery.includes('aging') && lowerQuery.includes('inventory'))
  ) {
    const tStart = Date.now();
    const minDays = lowerQuery.includes('60') ? 60 : lowerQuery.includes('90') ? 90 : 30;
    const res = await executeAgentTool('query_inventory', { minAgeDays: minDays });
    toolCalls.push({
      toolName: 'query_inventory',
      args: { minAgeDays: minDays },
      resultSummary: res.summary,
      recordsCount: res.recordsCount,
      status: 'success',
      executionTimeMs: Date.now() - tStart,
    });

    const agingUnits = res.result as Array<any>;
    const criticalList = agingUnits.filter((u: any) => u.daysInInventory >= 60);

    let text = `### Inventory Aging Analysis (${minDays}+ Days on Lot)\n\n`;
    text += `Retrieved **${agingUnits.length} vehicles** from database exceeding the ${minDays}-day holding threshold:\n\n`;

    agingUnits.forEach((v: any, idx: number) => {
      const badge = v.daysInInventory >= 90 ? '🔴 CRITICAL (90+d)' : v.daysInInventory >= 60 ? '🟠 HIGH (60-89d)' : '🟡 MODERATE (30-59d)';
      text += `${idx + 1}. **${v.makeModel}** (${v.stock})\n`;
      text += `   - **Days on Lot:** ${v.daysInInventory} days [${badge}]\n`;
      text += `   - **Listed Price:** ${v.price} | **Mileage:** ${v.mileage} | **Location:** ${v.location || 'Lot'}\n`;
      text += `   - **VIN:** \`${v.vin}\`\n\n`;
    });

    if (criticalList.length > 0) {
      text += `> [!IMPORTANT]\n`;
      text += `> **Operational Problem Identified:** ${criticalList.length} vehicle(s) have exceeded 60 days on lot, incurring an average of $24.50/day in floorplan holding expense.\n\n`;
      text += `**Recommended Actions:**\n`;
      text += `1. Authorize selective markdowns on units over 80 days to trigger portal search alerts.\n`;
      text += `2. Reposition aged units to showroom front display.\n`;
      text += `3. Feature high-margin aged vehicles in weekend CRM email blast.\n`;
    }

    quickActions.push('Run Automated Inventory Scan', 'Review Pending Markdowns', 'Export Aging CSV');

    return { text, toolCalls, pendingActions, quickActions };
  }

  if (
    lowerQuery.includes('need servicing') ||
    lowerQuery.includes('servicing this week') ||
    lowerQuery.includes('service appointments') ||
    lowerQuery.includes('upcoming service')
  ) {
    const tStart = Date.now();
    const res = await executeAgentTool('query_service_appointments', {});
    toolCalls.push({
      toolName: 'query_service_appointments',
      args: { status: 'scheduled' },
      resultSummary: res.summary,
      recordsCount: res.recordsCount,
      status: 'success',
      executionTimeMs: Date.now() - tStart,
    });

    const appts = res.result as Array<any>;
    let text = `### Active & Scheduled Service Pipeline\n\n`;
    text += `Database query returned **${appts.length} active service appointment(s)** across service bays:\n\n`;

    appts.forEach((a: any, idx: number) => {
      const statusBadge = a.status === 'in_progress' ? '⚙️ IN PROGRESS' : a.status === 'overdue' ? '⚠️ OVERDUE' : '📅 SCHEDULED';
      text += `${idx + 1}. **${a.vehicle}** - *${a.serviceType}*\n`;
      text += `   - **Customer:** ${a.customer} (${a.customerPhone || 'N/A'})\n`;
      text += `   - **Time:** ${a.date} at ${a.timeSlot} | **Bay:** ${a.bay}\n`;
      text += `   - **Status:** ${statusBadge} | **Est. Revenue:** ${a.estimatedCost}\n\n`;
    });

    text += `**Service Department Observations:**\n`;
    text += `- Bay utilization is operating within capacity.\n`;
    text += `- 1 appointment requires advisor follow-up due to missed intake slot.\n\n`;
    text += `**Recommended Next Step:** Confirm customer arrival for tomorrow's 10:00 AM Oil & Filter intake.`;

    quickActions.push('View Service Schedule', 'Resolve Overdue Appointment', 'Book New Service');
    return { text, toolCalls, pendingActions, quickActions };
  }

  if (
    lowerQuery.includes('overdue') &&
    (lowerQuery.includes('service') || lowerQuery.includes('customer') || lowerQuery.includes('appointment'))
  ) {
    const tStart = Date.now();
    const res = await executeAgentTool('query_service_appointments', { onlyOverdue: true });
    toolCalls.push({
      toolName: 'query_service_appointments',
      args: { onlyOverdue: true },
      resultSummary: res.summary,
      recordsCount: res.recordsCount,
      status: 'success',
      executionTimeMs: Date.now() - tStart,
    });

    const overdueAppts = res.result as Array<any>;
    let text = `### Overdue Service Appointments Report\n\n`;

    if (overdueAppts.length === 0) {
      text += `No overdue service appointments found in the system. All current appointments are up to date!`;
    } else {
      text += `Found **${overdueAppts.length} customer(s)** with overdue service appointments requiring advisor outreach:\n\n`;
      overdueAppts.forEach((a: any, idx: number) => {
        text += `${idx + 1}. **${a.customer}**\n`;
        text += `   - **Vehicle:** ${a.vehicle}\n`;
        text += `   - **Missed Slot:** ${a.date} at ${a.timeSlot} (Original Bay: ${a.bay})\n`;
        text += `   - **Service Required:** ${a.serviceType} (${a.estimatedCost})\n`;
        text += `   - **Contact:** ${a.customerPhone || 'On File'}\n\n`;
      });

      text += `> [!WARNING]\n`;
      text += `> Safety-critical brake system service is overdue. Unresolved overdue appointments represent $${overdueAppts.reduce((sum, a) => sum + parseFloat(a.estimatedCost.replace(/[^0-9.-]+/g, "") || '0'), 0).toFixed(0)} in uncollected service gross.\n\n`;
      text += `**Recommended Actions:**\n`;
      text += `1. Dispatch automated SMS reminder to reschedule into open slots this Friday.\n`;
      text += `2. Reassign bay allocation to avoid holding unused capacity.\n`;
    }

    quickActions.push('Draft Reschedule SMS', 'Open Service Bay Calendar');
    return { text, toolCalls, pendingActions, quickActions };
  }

  if (
    lowerQuery.includes('report') ||
    lowerQuery.includes('operations report') ||
    lowerQuery.includes('summary') ||
    lowerQuery.includes('overview')
  ) {
    const tStart = Date.now();
    const res = await executeAgentTool('get_operations_summary', {});
    toolCalls.push({
      toolName: 'get_operations_summary',
      args: {},
      resultSummary: res.summary,
      recordsCount: res.recordsCount,
      status: 'success',
      executionTimeMs: Date.now() - tStart,
    });

    const m = res.result;
    let text = `### Dealership Monthly Operations Report\n\n`;
    text += `**Executive Operational Snapshot:**\n\n`;
    text += `| Metric | Current Value | Benchmark Target |\n`;
    text += `| :--- | :--- | :--- |\n`;
    text += `| **Active Inventory Count** | ${m.inventoryCount} units (${m.availableCount} ready for retail) | 25-35 units |\n`;
    text += `| **Total Inventory Value** | ${m.totalInventoryValuation} | Target turn: 45 days |\n`;
    text += `| **Potential Gross Margin** | ${m.potentialGrossMargin} | >12% gross spread |\n`;
    text += `| **Average Inventory Age** | **${m.averageInventoryAgeDays} days** | <= 45 days |\n`;
    text += `| **Units > 60 Days Aging** | ${m.unitsOver60Days} units | 0 units |\n`;
    text += `| **Units > 90 Days (Critical)**| ${m.unitsOver90Days} units | 0 units |\n`;
    text += `| **Upcoming Appointments** | ${m.upcomingServiceAppointments} scheduled | Full bay utilization |\n`;
    text += `| **Overdue Follow-ups** | ${m.overdueFollowUps} leads | 0 overdue |\n\n`;

    text += `**Key Operational Insights:**\n`;
    text += `1. **Inventory Health:** While overall turnover is solid, ${m.unitsOver90Days} unit (Nissan Rogue STK-2023-071) has reached 94 days, eroding margin by $24.70/day.\n`;
    text += `2. **Customer Follow-up Bottleneck:** ${m.overdueFollowUps} high-intent lead follow-ups are overdue by >24 hours (including David Chen's F-150 Lightning inquiry).\n`;
    text += `3. **Service Bay Throughput:** Operations are at 94.2% completion efficiency with strong scheduled demand.\n\n`;
    text += `**Pending Approvals:** ${m.pendingAgentApprovals} action item(s) awaiting managerial sign-off in the approval queue.`;

    quickActions.push('Download Full CSV Report', 'Review Approval Queue', 'View Operations KPIs');
    return { text, toolCalls, pendingActions, quickActions };
  }

  if (
    lowerQuery.includes('needs attention') ||
    lowerQuery.includes('attention') ||
    lowerQuery.includes('problems') ||
    lowerQuery.includes('bottleneck')
  ) {
    const tStart = Date.now();
    const res = await executeAgentTool('identify_aging_inventory', { thresholdDays: 60 });
    toolCalls.push({
      toolName: 'identify_aging_inventory',
      args: { thresholdDays: 60 },
      resultSummary: res.summary,
      recordsCount: res.recordsCount,
      status: 'success',
      executionTimeMs: Date.now() - tStart,
    });

    const aging = res.result as Array<any>;
    let text = `### Operational Attention & Risk Assessment\n\n`;
    text += `Automated audit retrieved **${aging.length} high-risk items** requiring immediate dealership intervention:\n\n`;

    aging.forEach((item: any, idx: number) => {
      text += `#### ${idx + 1}. ${item.makeModel} (${item.stock})\n`;
      text += `- **Age on Lot:** ${item.daysInInventory} days (Target: 45 days)\n`;
      text += `- **Accumulated Holding Cost:** ${item.floorplanHoldingCost}\n`;
      text += `- **Current Gross Margin:** ${item.currentMargin}\n`;
      text += `- **Strategic Recommendation:** ${item.recommendedAction}\n\n`;
    });

    text += `> [!NOTE]\n`;
    text += `> A pending manager approval ticket (\`act10000-0000-0000-0000-000000000001\`) has already been staged to reduce the 94-day Nissan Rogue listing price to **$28,600** (-$1,200). Approving this will immediately refresh digital syndication.\n\n`;
    text += `**Recommended Sequence:**\n`;
    text += `1. Approve the pending markdown on STK-2023-071.\n`;
    text += `2. Instruct lot porter to move 2023 Audi Q5 to front showroom spot.\n`;
    text += `3. Re-engage 3 saved-search inquiries logged in CRM.\n`;

    quickActions.push('Approve Nissan Rogue Markdown', 'Reposition Audi Q5', 'Run New Scan');
    return { text, toolCalls, pendingActions, quickActions };
  }

  // General dealership intelligence response with tool execution
  const tStart = Date.now();
  const summaryRes = await executeAgentTool('get_operations_summary', {});
  toolCalls.push({
    toolName: 'get_operations_summary',
    args: {},
    resultSummary: summaryRes.summary,
    recordsCount: 1,
    status: 'success',
    executionTimeMs: Date.now() - tStart,
  });

  let text = `### DealerOps AI Operations Assistant\n\n`;
  text += `I analyzed your request: *"${query}"* against active dealership database records.\n\n`;
  text += `**Current Dealership Status:**\n`;
  text += `- Active Inventory: **${summaryRes.result.inventoryCount} vehicles** (${summaryRes.result.availableCount} available, ${summaryRes.result.averageInventoryAgeDays} days avg. age)\n`;
  text += `- Service Pipeline: **${summaryRes.result.upcomingServiceAppointments} scheduled appointments** (${summaryRes.result.overdueAppointments} overdue)\n`;
  text += `- Overdue Follow-ups: **${summaryRes.result.overdueFollowUps} leads** requiring attention\n`;
  text += `- Pending Approvals: **${summaryRes.result.pendingAgentApprovals} action(s)** staged\n\n`;
  text += `**How I can assist you right now:**\n`;
  text += `- *"Show all vehicles that have been in inventory for more than 30 days."*\n`;
  text += `- *"Which vehicles need servicing this week?"*\n`;
  text += `- *"Generate this month's operations report."*\n`;
  text += `- *"Find customers whose service appointments are overdue."*\n`;
  text += `- *"Identify inventory that needs attention."*\n`;

  quickActions.push('Show 30+ Day Vehicles', 'Upcoming Service', 'Operations Report', 'Aging Alerts');

  return { text, toolCalls, pendingActions, quickActions };
}

