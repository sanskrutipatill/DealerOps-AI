import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { executeAgentTool, processAgentQuery } from '../lib/gemini';
import { calculateDaysInInventory, getAgingSeverity } from '../lib/utils';

describe('DealerOps AI - Enterprise Business Logic Tests', () => {
  beforeEach(() => {
    // Re-verify db state before each test
  });

  describe('1. Inventory Aging & Severity Rules', () => {
    it('should correctly classify inventory aging brackets', () => {
      const fresh = getAgingSeverity(15);
      expect(fresh.priority).toBe('low');
      expect(fresh.isAging).toBe(false);

      const moderate = getAgingSeverity(45);
      expect(moderate.priority).toBe('medium');
      expect(moderate.isAging).toBe(true);

      const high = getAgingSeverity(75);
      expect(high.priority).toBe('high');
      expect(high.isAging).toBe(true);

      const critical = getAgingSeverity(95);
      expect(critical.priority).toBe('critical');
      expect(critical.isAging).toBe(true);
    });

    it('should calculate days in inventory accurately', () => {
      const today = new Date().toISOString().split('T')[0];
      const days = calculateDaysInInventory(today);
      expect(days).toBe(0);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const thirtyDays = calculateDaysInInventory(thirtyDaysAgo);
      expect(thirtyDays).toBe(30);
    });

    it('should filter vehicles by minAge threshold correctly', async () => {
      const agingOver60 = await db.getVehicles({ minAge: 60 });
      expect(agingOver60.length).toBeGreaterThanOrEqual(1);
      agingOver60.forEach((v) => {
        expect((v.days_in_inventory || 0)).toBeGreaterThanOrEqual(60);
      });
    });
  });

  describe('2. Service Appointment Conflict Prevention Engine', () => {
    it('should allow booking when no advisor or bay conflict exists', async () => {
      const result = await db.checkAppointmentConflict({
        appointment_date: '2026-12-01',
        time_slot: '09:00 AM',
        assigned_advisor_id: 'u3333333-3333-3333-3333-333333333333',
        bay_number: 8,
      });
      expect(result.hasConflict).toBe(false);
    });

    it('should detect and prevent advisor double-booking at same time slot', async () => {
      // First book a slot
      const apptRes = await db.createServiceAppointment({
        customer_id: 'c1010000-0000-0000-0000-000000000001',
        vehicle_id: 'v1010000-0000-0000-0000-000000000001',
        assigned_advisor_id: 'u3333333-3333-3333-3333-333333333333',
        service_type: 'Brake System',
        appointment_date: '2026-11-20',
        time_slot: '01:00 PM',
        bay_number: 5,
        estimated_duration_hours: 1.5,
        estimated_cost: 250,
        status: 'scheduled',
      });
      expect(apptRes.success).toBe(true);

      // Attempt to book same advisor at identical date & time slot
      const conflict = await db.checkAppointmentConflict({
        appointment_date: '2026-11-20',
        time_slot: '01:00 PM',
        assigned_advisor_id: 'u3333333-3333-3333-3333-333333333333',
        bay_number: 6, // different bay, but same advisor
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.reason).toContain('Carlos Mendez');
    });

    it('should detect and prevent bay collision at same time slot', async () => {
      // Attempt to book same bay on 2026-11-20 at 01:00 PM where bay 5 is taken
      const conflict = await db.checkAppointmentConflict({
        appointment_date: '2026-11-20',
        time_slot: '01:00 PM',
        assigned_advisor_id: 'u2222222-2222-2222-2222-222222222222', // different advisor
        bay_number: 5, // occupied bay
      });

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.reason).toContain('Service Bay #5 is already occupied');
    });
  });

  describe('3. AI Operations Agent Structured Tool Calling', () => {
    it('should execute query_inventory tool with minimum age filter', async () => {
      const toolRes = await executeAgentTool('query_inventory', { minAgeDays: 30 });
      expect(toolRes.recordsCount).toBeGreaterThanOrEqual(1);
      expect(toolRes.summary).toContain('Found');
      const records = toolRes.result as Array<any>;
      records.forEach((r) => {
        expect(r.daysInInventory).toBeGreaterThanOrEqual(30);
      });
    });

    it('should execute get_operations_summary tool returning real KPIs', async () => {
      const toolRes = await executeAgentTool('get_operations_summary', {});
      expect(toolRes.recordsCount).toBe(1);
      expect(toolRes.result).toHaveProperty('inventoryCount');
      expect(toolRes.result).toHaveProperty('averageInventoryAgeDays');
      expect(toolRes.result.inventoryCount).toBeGreaterThan(0);
    });

    it('should process natural language query: "Show all vehicles that have been in inventory for more than 30 days."', async () => {
      const response = await processAgentQuery(
        'Show all vehicles that have been in inventory for more than 30 days.'
      );
      expect(response.toolCalls.length).toBeGreaterThan(0);
      expect(response.toolCalls[0].toolName).toBe('query_inventory');
      expect(response.text).toContain('Inventory Aging Analysis');
      expect(response.text).toContain('Days on Lot');
    });
  });

  describe('4. Manager Approval & Action Execution Workflow', () => {
    it('should update vehicle price when a markdown action is approved', async () => {
      // Find a vehicle
      const vehicles = await db.getVehicles({ status: 'available' });
      const targetVehicle = vehicles[0];
      const originalPrice = targetVehicle.selling_price;
      const newPrice = originalPrice - 1000;

      // Create a pending action
      const action = await db.createAgentAction({
        action_type: 'inventory_markdown',
        status: 'pending_approval',
        target_entity_type: 'vehicle',
        target_entity_id: targetVehicle.id,
        parameters: {
          current_price: originalPrice,
          new_price: newPrice,
          discount_amount: 1000,
        },
        reasoning: 'Test aging markdown',
        impact_summary: 'Reduces price by $1000',
      });

      expect(action.status).toBe('pending_approval');

      // Manager approves action
      const approver = await db.getActiveProfile();
      const approvalRes = await db.approveAgentAction(action.id, approver.id);
      expect(approvalRes.success).toBe(true);

      // Verify the vehicle in the database now reflects new price
      const updatedVehicle = await db.getVehicleById(targetVehicle.id);
      expect(updatedVehicle?.selling_price).toBe(newPrice);
    });

    it('should mark follow-up as sent and append history when approved', async () => {
      const followups = await db.getFollowUps({ status: 'pending' });
      expect(followups.length).toBeGreaterThan(0);
      const targetFu = followups[0];

      const approver = await db.getActiveProfile();
      const action = await db.createAgentAction({
        action_type: 'send_followup',
        status: 'pending_approval',
        target_entity_type: 'follow_up',
        target_entity_id: targetFu.id,
        parameters: {
          message: 'Approved test message for customer.',
        },
        reasoning: 'Test follow-up approval',
        impact_summary: 'Dispatches SMS',
      });

      await db.approveAgentAction(action.id, approver.id);

      const updatedFu = (await db.getFollowUps()).find((f) => f.id === targetFu.id);
      expect(updatedFu?.status).toBe('sent');
      expect(updatedFu?.interaction_history?.length).toBeGreaterThan(0);
    });
  });
});

