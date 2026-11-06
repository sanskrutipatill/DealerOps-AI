// DealerOps AI - Core Enterprise Types

export type UserRole =
  | 'dealer_principal'
  | 'operations_manager'
  | 'service_advisor'
  | 'sales_rep';

export interface Dealership {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  dealership_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export type VehicleStatus = 'available' | 'in_service' | 'reserved' | 'sold';
export type FuelType = 'Gasoline' | 'Hybrid' | 'Electric' | 'Diesel' | 'Plug-in Hybrid';
export type TransmissionType = 'Automatic' | 'Manual' | 'CVT' | 'Dual-Clutch';
export type BodyType = 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Hatchback' | 'Van' | 'Wagon';

export interface Vehicle {
  id: string;
  dealership_id: string;
  vin: string;
  stock_number: string;
  brand: string;
  model: string;
  year: number;
  trim?: string;
  body_type: BodyType;
  purchase_price: number;
  selling_price: number;
  mileage: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  exterior_color: string;
  interior_color?: string;
  inventory_date: string; // YYYY-MM-DD
  status: VehicleStatus;
  location_bay?: string;
  notes?: string;
  days_in_inventory?: number; // computed
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  dealership_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact: 'email' | 'sms' | 'phone';
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export type ServiceTimeSlot =
  | '08:00 AM'
  | '09:00 AM'
  | '10:00 AM'
  | '11:00 AM'
  | '01:00 PM'
  | '02:00 PM'
  | '03:00 PM'
  | '04:00 PM'
  | '05:00 PM';

export interface ServiceAppointment {
  id: string;
  dealership_id: string;
  customer_id: string;
  vehicle_id: string;
  assigned_advisor_id?: string;
  service_type: string;
  appointment_date: string; // YYYY-MM-DD
  time_slot: ServiceTimeSlot;
  bay_number?: number;
  estimated_duration_hours: number;
  estimated_cost: number;
  status: AppointmentStatus;
  service_notes?: string;
  completion_date?: string;
  created_at?: string;
  // Joined fields for display
  customer?: Customer;
  vehicle?: Vehicle;
  advisor?: Profile;
}

export type FollowUpType =
  | 'service_reminder'
  | 'post_service_satisfaction'
  | 'sales_inquiry'
  | 'lease_expiry'
  | 'warranty_check';

export type FollowUpPriority = 'high' | 'medium' | 'low';
export type FollowUpStatus = 'pending' | 'approved' | 'sent' | 'completed' | 'dismissed';

export interface FollowUp {
  id: string;
  dealership_id: string;
  customer_id: string;
  vehicle_id?: string;
  assigned_to?: string;
  type: FollowUpType;
  priority: FollowUpPriority;
  due_date: string;
  status: FollowUpStatus;
  draft_message: string;
  channel: 'email' | 'sms' | 'phone';
  interaction_history?: Array<{
    timestamp: string;
    channel: string;
    notes: string;
    outcome?: string;
  }>;
  created_at?: string;
  // Joined fields
  customer?: Customer;
  vehicle?: Vehicle;
  assignee?: Profile;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType =
  | 'aging_critical'
  | 'pricing_review'
  | 'service_inspection_needed'
  | 'low_inquiry_activity';

export interface InventoryAlert {
  id: string;
  dealership_id: string;
  vehicle_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  reasoning: string;
  suggested_action: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at?: string;
  vehicle?: Vehicle;
}

export type ActionStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'failed';

export interface AgentAction {
  id: string;
  dealership_id: string;
  user_id?: string;
  action_type: string;
  status: ActionStatus;
  target_entity_type: 'vehicle' | 'service_appointment' | 'follow_up' | 'inventory_alert';
  target_entity_id: string;
  parameters: Record<string, any>;
  reasoning: string;
  impact_summary: string;
  approved_by?: string;
  executed_at?: string;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  dealership_id: string;
  user_id?: string;
  actor_type: 'agent' | 'user' | 'system';
  action: string;
  details: Record<string, any>;
  created_at: string;
}

// AI Operations Agent Types
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: AgentToolCallRecord[];
  pendingActions?: AgentAction[];
  quickActions?: string[];
}

export interface AgentToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  resultSummary?: string;
  recordsCount?: number;
  status: 'executing' | 'success' | 'error';
  executionTimeMs?: number;
}

