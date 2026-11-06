import {
  Dealership,
  Profile,
  Vehicle,
  Customer,
  ServiceAppointment,
  FollowUp,
  InventoryAlert,
  AgentAction,
  ActivityLog,
  VehicleStatus,
  ServiceTimeSlot,
  AppointmentStatus,
  FollowUpStatus,
} from '@/types';
import {
  INITIAL_DEALERSHIP,
  INITIAL_PROFILES,
  INITIAL_VEHICLES,
  INITIAL_CUSTOMERS,
  INITIAL_APPOINTMENTS,
  INITIAL_FOLLOWUPS,
  INITIAL_ALERTS,
  INITIAL_AGENT_ACTIONS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';
import { calculateDaysInInventory } from './utils';
import { supabase, isSupabaseConfigured } from './supabase';

// In-memory persistent state container for runtime / demo mode
class DatabaseStore {
  private static instance: DatabaseStore;

  dealership: Dealership = INITIAL_DEALERSHIP;
  profiles: Profile[] = [...INITIAL_PROFILES];
  vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  customers: Customer[] = [...INITIAL_CUSTOMERS];
  appointments: ServiceAppointment[] = [...INITIAL_APPOINTMENTS];
  followups: FollowUp[] = [...INITIAL_FOLLOWUPS];
  alerts: InventoryAlert[] = [...INITIAL_ALERTS];
  agentActions: AgentAction[] = [...INITIAL_AGENT_ACTIONS];
  activityLogs: ActivityLog[] = [...INITIAL_ACTIVITY_LOGS];

  activeProfileId: string = INITIAL_PROFILES[1].id; // Sarah Jenkins (operations_manager)

  private constructor() {
    this.refreshComputedFields();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  public refreshComputedFields() {
    this.vehicles = this.vehicles.map((v) => ({
      ...v,
      days_in_inventory: calculateDaysInInventory(v.inventory_date),
    }));
  }

  public resetToDefaults() {
    this.dealership = { ...INITIAL_DEALERSHIP };
    this.profiles = [...INITIAL_PROFILES];
    this.vehicles = [...INITIAL_VEHICLES];
    this.customers = [...INITIAL_CUSTOMERS];
    this.appointments = [...INITIAL_APPOINTMENTS];
    this.followups = [...INITIAL_FOLLOWUPS];
    this.alerts = [...INITIAL_ALERTS];
    this.agentActions = [...INITIAL_AGENT_ACTIONS];
    this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
    this.activeProfileId = INITIAL_PROFILES[1].id;
    this.refreshComputedFields();
  }
}

const store = DatabaseStore.getInstance();

export const db = {
  // Dealership & Profile
  async getDealership(): Promise<Dealership> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('dealerships').select('*').limit(1).single();
      if (data) return data;
    }
    return store.dealership;
  },

  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) return data;
    }
    return store.profiles;
  },

  async getActiveProfile(): Promise<Profile> {
    const profile = store.profiles.find((p) => p.id === store.activeProfileId);
    return profile || store.profiles[0];
  },

  async setActiveProfile(profileId: string): Promise<Profile> {
    const found = store.profiles.find((p) => p.id === profileId);
    if (found) {
      store.activeProfileId = profileId;
      return found;
    }
    return store.profiles[0];
  },

  // Vehicles CRUD
  async getVehicles(filters?: {
    search?: string;
    status?: VehicleStatus;
    fuel_type?: string;
    brand?: string;
    minAge?: number;
    maxAge?: number;
  }): Promise<Vehicle[]> {
    store.refreshComputedFields();
    let list = [...store.vehicles];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          v.stock_number.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      list = list.filter((v) => v.status === filters.status);
    }
    if (filters?.fuel_type) {
      list = list.filter((v) => v.fuel_type === filters.fuel_type);
    }
    if (filters?.brand) {
      list = list.filter((v) => v.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (typeof filters?.minAge === 'number') {
      list = list.filter((v) => (v.days_in_inventory || 0) >= filters.minAge!);
    }
    if (typeof filters?.maxAge === 'number') {
      list = list.filter((v) => (v.days_in_inventory || 0) <= filters.maxAge!);
    }

    return list.sort((a, b) => (b.days_in_inventory || 0) - (a.days_in_inventory || 0));
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    store.refreshComputedFields();
    return store.vehicles.find((v) => v.id === id) || null;
  },

  async createVehicle(
    data: Omit<Vehicle, 'id' | 'dealership_id' | 'created_at' | 'updated_at' | 'days_in_inventory'>
  ): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      ...data,
      id: 'v-' + Math.random().toString(36).substring(2, 11),
      dealership_id: store.dealership.id,
      days_in_inventory: calculateDaysInInventory(data.inventory_date),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.vehicles.unshift(newVehicle);
    await this.recordActivityLog('user', 'vehicle_created', {
      vehicle_id: newVehicle.id,
      vin: newVehicle.vin,
      model: `${newVehicle.year} ${newVehicle.brand} ${newVehicle.model}`,
    });

    return newVehicle;
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return null;

    const updated = {
      ...store.vehicles[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    if (data.inventory_date) {
      updated.days_in_inventory = calculateDaysInInventory(data.inventory_date);
    }
    store.vehicles[index] = updated;

    await this.recordActivityLog('user', 'vehicle_updated', {
      vehicle_id: id,
      updated_fields: Object.keys(data),
    });

    return updated;
  },

  async deleteVehicle(id: string): Promise<boolean> {
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return false;
    const removed = store.vehicles.splice(index, 1)[0];
    await this.recordActivityLog('user', 'vehicle_deleted', {
      vehicle_id: id,
      vin: removed.vin,
    });
    return true;
  },

  // Service Appointments CRUD & Conflict Prevention
  async getServiceAppointments(filters?: {
    date?: string;
    status?: AppointmentStatus;
    advisor_id?: string;
    customer_id?: string;
  }): Promise<ServiceAppointment[]> {
    let list = [...store.appointments];

    if (filters?.date) {
      list = list.filter((a) => a.appointment_date === filters.date);
    }
    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.advisor_id) {
      list = list.filter((a) => a.assigned_advisor_id === filters.advisor_id);
    }
    if (filters?.customer_id) {
      list = list.filter((a) => a.customer_id === filters.customer_id);
    }

    // Populate joined relations
    return list.map((a) => ({
      ...a,
      customer: store.customers.find((c) => c.id === a.customer_id),
      vehicle: store.vehicles.find((v) => v.id === a.vehicle_id),
      advisor: store.profiles.find((p) => p.id === a.assigned_advisor_id),
    }));
  },

  /**
   * Conflict Prevention Engine
   * Checks whether the advisor is already booked at that slot or bay is occupied
   */
  async checkAppointmentConflict(params: {
    appointment_date: string;
    time_slot: ServiceTimeSlot;
    assigned_advisor_id?: string;
    bay_number?: number;
    excludeAppointmentId?: string;
  }): Promise<{ hasConflict: boolean; reason?: string }> {
    const activeAppointments = store.appointments.filter(
      (a) =>
        a.appointment_date === params.appointment_date &&
        a.time_slot === params.time_slot &&
        a.status !== 'cancelled' &&
        a.status !== 'completed' &&
        a.id !== params.excludeAppointmentId
    );

    // 1. Advisor double booking check
    if (params.assigned_advisor_id) {
      const advisorBusy = activeAppointments.find(
        (a) => a.assigned_advisor_id === params.assigned_advisor_id
      );
      if (advisorBusy) {
        const advisor = store.profiles.find((p) => p.id === params.assigned_advisor_id);
        return {
          hasConflict: true,
          reason: `Service Advisor ${advisor?.full_name || 'Assigned Advisor'} is already scheduled for an appointment at ${params.time_slot} on ${params.appointment_date}.`,
        };
      }
    }

    // 2. Bay collision check
    if (params.bay_number) {
      const bayOccupied = activeAppointments.find((a) => a.bay_number === params.bay_number);
      if (bayOccupied) {
        return {
          hasConflict: true,
          reason: `Service Bay #${params.bay_number} is already occupied at ${params.time_slot} on ${params.appointment_date}.`,
        };
      }
    }

    return { hasConflict: false };
  },

  async createServiceAppointment(
    data: Omit<ServiceAppointment, 'id' | 'dealership_id' | 'created_at'>
  ): Promise<{ success: boolean; appointment?: ServiceAppointment; error?: string }> {
    const conflict = await this.checkAppointmentConflict({
      appointment_date: data.appointment_date,
      time_slot: data.time_slot,
      assigned_advisor_id: data.assigned_advisor_id,
      bay_number: data.bay_number,
    });

    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason };
    }

    const newAppt: ServiceAppointment = {
      ...data,
      id: 's-' + Math.random().toString(36).substring(2, 11),
      dealership_id: store.dealership.id,
      created_at: new Date().toISOString(),
    };

    store.appointments.push(newAppt);

    await this.recordActivityLog('user', 'service_appointment_scheduled', {
      appointment_id: newAppt.id,
      date: newAppt.appointment_date,
      time_slot: newAppt.time_slot,
      service_type: newAppt.service_type,
    });

    return { success: true, appointment: newAppt };
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string
  ): Promise<ServiceAppointment | null> {
    const index = store.appointments.findIndex((a) => a.id === id);
    if (index === -1) return null;

    store.appointments[index].status = status;
    if (notes) store.appointments[index].service_notes = notes;
    if (status === 'completed') {
      store.appointments[index].completion_date = new Date().toISOString();
    }

    await this.recordActivityLog('user', 'service_appointment_status_changed', {
      appointment_id: id,
      new_status: status,
    });

    return store.appointments[index];
  },

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    let list = [...store.customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }
    return list;
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    return store.customers.find((c) => c.id === id) || null;
  },

  async createCustomer(
    data: Omit<Customer, 'id' | 'dealership_id' | 'created_at'>
  ): Promise<Customer> {
    const newCust: Customer = {
      ...data,
      id: 'c-' + Math.random().toString(36).substring(2, 11),
      dealership_id: store.dealership.id,
      created_at: new Date().toISOString(),
    };
    store.customers.push(newCust);
    return newCust;
  },

  // Follow-Ups
  async getFollowUps(filters?: {
    status?: FollowUpStatus;
    priority?: string;
    isOverdue?: boolean;
  }): Promise<FollowUp[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    let list = [...store.followups];

    if (filters?.status) {
      list = list.filter((f) => f.status === filters.status);
    }
    if (filters?.priority) {
      list = list.filter((f) => f.priority === filters.priority);
    }
    if (filters?.isOverdue) {
      list = list.filter((f) => f.due_date < todayStr && f.status === 'pending');
    }

    return list.map((f) => ({
      ...f,
      customer: store.customers.find((c) => c.id === f.customer_id),
      vehicle: store.vehicles.find((v) => v.id === f.vehicle_id),
      assignee: store.profiles.find((p) => p.id === f.assigned_to),
    }));
  },

  async updateFollowUpStatus(
    id: string,
    status: FollowUpStatus,
    outcomeNote?: string
  ): Promise<FollowUp | null> {
    const index = store.followups.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const item = store.followups[index];
    item.status = status;

    if (outcomeNote) {
      if (!item.interaction_history) item.interaction_history = [];
      item.interaction_history.push({
        timestamp: new Date().toISOString(),
        channel: item.channel,
        notes: outcomeNote,
        outcome: status === 'sent' ? 'Message Dispatched' : status,
      });
    }

    await this.recordActivityLog('user', 'followup_status_updated', {
      follow_up_id: id,
      new_status: status,
    });

    return item;
  },

  async updateFollowUpDraft(id: string, draft: string): Promise<FollowUp | null> {
    const index = store.followups.findIndex((f) => f.id === id);
    if (index === -1) return null;
    store.followups[index].draft_message = draft;
    return store.followups[index];
  },

  // Inventory Alerts & Diagnostics
  async getInventoryAlerts(onlyActive: boolean = true): Promise<InventoryAlert[]> {
    let list = [...store.alerts];
    if (onlyActive) {
      list = list.filter((a) => !a.is_resolved);
    }
    return list.map((a) => ({
      ...a,
      vehicle: store.vehicles.find((v) => v.id === a.vehicle_id),
    }));
  },

  async resolveAlert(id: string): Promise<boolean> {
    const alert = store.alerts.find((a) => a.id === id);
    if (!alert) return false;
    alert.is_resolved = true;
    alert.resolved_at = new Date().toISOString();
    await this.recordActivityLog('user', 'alert_resolved', { alert_id: id });
    return true;
  },

  // Autonomous / On-Demand Inventory Intelligence Analysis
  async runInventoryIntelligenceScan(): Promise<{
    inspectedVehicles: number;
    generatedAlerts: InventoryAlert[];
    recommendedActions: AgentAction[];
  }> {
    store.refreshComputedFields();
    const generatedAlerts: InventoryAlert[] = [];
    const recommendedActions: AgentAction[] = [];

    const vehicles = store.vehicles.filter((v) => v.status === 'available');

    for (const v of vehicles) {
      const age = v.days_in_inventory || 0;
      const margin = v.selling_price - v.purchase_price;
      const carryingCostPerDay = 24.5;
      const accumulatedCarryingCost = age * carryingCostPerDay;

      // Rule 1: Extreme Aging (> 80 days)
      if (age >= 80) {
        const existingAlert = store.alerts.find(
          (a) => a.vehicle_id === v.id && !a.is_resolved && a.alert_type === 'aging_critical'
        );
        if (!existingAlert) {
          const alert: InventoryAlert = {
            id: 'a-' + Math.random().toString(36).substring(2, 11),
            dealership_id: store.dealership.id,
            vehicle_id: v.id,
            alert_type: 'aging_critical',
            severity: age >= 90 ? 'critical' : 'high',
            title: `Aging Alert: ${v.year} ${v.brand} ${v.model} (${age} Days)`,
            message: `Unit has exceeded aging threshold. Estimated floorplan cost has reached $${accumulatedCarryingCost.toFixed(0)}.`,
            reasoning: `Industry target inventory turnover is <=45 days. Gross margin of $${margin.toLocaleString()} will decline further without retail velocity.`,
            suggested_action: `Recommend markdown of $${Math.min(1200, Math.floor(margin * 0.3))} and digital portal promotion.`,
            is_resolved: false,
            created_at: new Date().toISOString(),
          };
          store.alerts.push(alert);
          generatedAlerts.push(alert);

          // Propose actionable markdown request for approval
          const proposedDiscount = Math.min(1200, Math.floor(margin * 0.3));
          if (proposedDiscount > 300) {
            const action: AgentAction = {
              id: 'act-' + Math.random().toString(36).substring(2, 11),
              dealership_id: store.dealership.id,
              action_type: 'inventory_markdown',
              status: 'pending_approval',
              target_entity_type: 'vehicle',
              target_entity_id: v.id,
              parameters: {
                stock_number: v.stock_number,
                brand: v.brand,
                model: v.model,
                current_price: v.selling_price,
                new_price: v.selling_price - proposedDiscount,
                discount_amount: proposedDiscount,
              },
              reasoning: `Vehicle age is ${age} days. Markdown of $${proposedDiscount} preserves $${(margin - proposedDiscount).toLocaleString()} in profit while accelerating sale before month end.`,
              impact_summary: `Lowers listing price to $${(v.selling_price - proposedDiscount).toLocaleString()} (-${((proposedDiscount / v.selling_price) * 100).toFixed(1)}%).`,
              created_at: new Date().toISOString(),
            };
            store.agentActions.push(action);
            recommendedActions.push(action);
          }
        }
      }

      // Rule 2: Low inquiry / Stagnant (60 - 79 days)
      if (age >= 60 && age < 80) {
        const existingAlert = store.alerts.find(
          (a) => a.vehicle_id === v.id && !a.is_resolved
        );
        if (!existingAlert) {
          const alert: InventoryAlert = {
            id: 'a-' + Math.random().toString(36).substring(2, 11),
            dealership_id: store.dealership.id,
            vehicle_id: v.id,
            alert_type: 'pricing_review',
            severity: 'medium',
            title: `Stagnant Watch: ${v.brand} ${v.model} (${age} Days)`,
            message: `Entering 60-day watch window. Carrying cost is $${accumulatedCarryingCost.toFixed(0)}.`,
            reasoning: `Vehicle turnover in this segment averages 35 days. Recommend physical lot repositioning or visual refresh.`,
            suggested_action: `Move to front showroom row and review current pricing.`,
            is_resolved: false,
            created_at: new Date().toISOString(),
          };
          store.alerts.push(alert);
          generatedAlerts.push(alert);
        }
      }
    }

    await this.recordActivityLog('agent', 'inventory_intelligence_scan_executed', {
      scanned_count: vehicles.length,
      alerts_created: generatedAlerts.length,
      actions_proposed: recommendedActions.length,
    });

    return {
      inspectedVehicles: vehicles.length,
      generatedAlerts,
      recommendedActions,
    };
  },

  // AI Agent Pending Actions & Approvals Workflow
  async getAgentActions(filters?: { status?: string }): Promise<AgentAction[]> {
    let list = [...store.agentActions];
    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async createAgentAction(data: Omit<AgentAction, 'id' | 'dealership_id' | 'created_at'>): Promise<AgentAction> {
    const action: AgentAction = {
      ...data,
      id: 'act-' + Math.random().toString(36).substring(2, 11),
      dealership_id: store.dealership.id,
      created_at: new Date().toISOString(),
    };
    store.agentActions.push(action);
    await this.recordActivityLog('agent', 'agent_action_requested', {
      action_id: action.id,
      action_type: action.action_type,
      target_type: action.target_entity_type,
    });
    return action;
  },

  async approveAgentAction(
    actionId: string,
    approverId: string
  ): Promise<{ success: boolean; message: string }> {
    const action = store.agentActions.find((a) => a.id === actionId);
    if (!action) return { success: false, message: 'Action not found.' };

    action.status = 'approved';
    action.approved_by = approverId;
    action.executed_at = new Date().toISOString();

    // Execute actual domain state modification
    if (action.action_type === 'inventory_markdown' && action.target_entity_type === 'vehicle') {
      const vehicle = store.vehicles.find((v) => v.id === action.target_entity_id);
      if (vehicle && action.parameters?.new_price) {
        vehicle.selling_price = Number(action.parameters.new_price);
        action.status = 'executed';
      }
    } else if (action.action_type === 'send_followup' && action.target_entity_type === 'follow_up') {
      const followUp = store.followups.find((f) => f.id === action.target_entity_id);
      if (followUp) {
        followUp.status = 'sent';
        if (!followUp.interaction_history) followUp.interaction_history = [];
        followUp.interaction_history.push({
          timestamp: new Date().toISOString(),
          channel: followUp.channel,
          notes: action.parameters.message || 'AI message dispatched after manager approval.',
          outcome: 'Dispatched to customer',
        });
        action.status = 'executed';
      }
    } else if (action.action_type === 'vehicle_status_change' && action.target_entity_type === 'vehicle') {
      const vehicle = store.vehicles.find((v) => v.id === action.target_entity_id);
      if (vehicle && action.parameters?.new_status) {
        vehicle.status = action.parameters.new_status;
        action.status = 'executed';
      }
    }

    await this.recordActivityLog('user', 'agent_action_approved', {
      action_id: actionId,
      action_type: action.action_type,
      approved_by: approverId,
    });

    return { success: true, message: `Action ${action.action_type} successfully approved and executed.` };
  },

  async rejectAgentAction(actionId: string, rejectorId: string): Promise<boolean> {
    const action = store.agentActions.find((a) => a.id === actionId);
    if (!action) return false;
    action.status = 'rejected';
    await this.recordActivityLog('user', 'agent_action_rejected', {
      action_id: actionId,
      rejected_by: rejectorId,
    });
    return true;
  },

  // Activity & Audit Logging
  async recordActivityLog(
    actorType: 'agent' | 'user' | 'system',
    action: string,
    details: Record<string, any>
  ): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 11),
      dealership_id: store.dealership.id,
      actor_type: actorType,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    store.activityLogs.unshift(log);
    return log;
  },

  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return store.activityLogs.slice(0, limit);
  },

  // KPI Operations Metrics
  async getOperationsMetrics() {
    store.refreshComputedFields();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalVehicles = store.vehicles.length;
    const availableVehicles = store.vehicles.filter((v) => v.status === 'available').length;
    const inServiceVehicles = store.vehicles.filter((v) => v.status === 'in_service').length;
    const reservedVehicles = store.vehicles.filter((v) => v.status === 'reserved').length;
    const soldVehicles = store.vehicles.filter((v) => v.status === 'sold').length;

    const availableList = store.vehicles.filter((v) => v.status === 'available');
    const totalInventoryValue = availableList.reduce((acc, v) => acc + v.selling_price, 0);
    const totalAcquisitionCost = availableList.reduce((acc, v) => acc + v.purchase_price, 0);
    const potentialMargin = totalInventoryValue - totalAcquisitionCost;

    const avgInventoryAge =
      availableList.length > 0
        ? Math.round(
            availableList.reduce((acc, v) => acc + (v.days_in_inventory || 0), 0) /
              availableList.length
          )
        : 0;

    const agingOver60Days = availableList.filter((v) => (v.days_in_inventory || 0) >= 60).length;
    const agingOver90Days = availableList.filter((v) => (v.days_in_inventory || 0) >= 90).length;

    const upcomingAppointments = store.appointments.filter(
      (a) => a.appointment_date >= todayStr && a.status === 'scheduled'
    ).length;

    const inProgressAppointments = store.appointments.filter(
      (a) => a.status === 'in_progress'
    ).length;

    const overdueAppointments = store.appointments.filter(
      (a) =>
        (a.status === 'overdue' || (a.appointment_date < todayStr && a.status === 'scheduled'))
    ).length;

    const overdueFollowUps = store.followups.filter(
      (f) => f.due_date < todayStr && f.status === 'pending'
    ).length;

    const pendingAgentApprovals = store.agentActions.filter(
      (a) => a.status === 'pending_approval'
    ).length;

    const activeAlertsCount = store.alerts.filter((a) => !a.is_resolved).length;

    // Monthly simulated sales revenue
    const monthlySalesRevenue = 428500;
    const serviceThroughputRate = 94.2; // 94.2% completion efficiency

    return {
      totalVehicles,
      availableVehicles,
      inServiceVehicles,
      reservedVehicles,
      soldVehicles,
      totalInventoryValue,
      totalAcquisitionCost,
      potentialMargin,
      avgInventoryAge,
      agingOver60Days,
      agingOver90Days,
      upcomingAppointments,
      inProgressAppointments,
      overdueAppointments,
      overdueFollowUps,
      pendingAgentApprovals,
      activeAlertsCount,
      monthlySalesRevenue,
      serviceThroughputRate,
    };
  },
};

