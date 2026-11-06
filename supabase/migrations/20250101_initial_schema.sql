-- DealerOps AI Database Migration: Initial Schema
-- PostgreSQL with Row Level Security (RLS) for multi-tenant dealership data isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles with roles and dealership isolation
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('dealer_principal', 'operations_manager', 'service_advisor', 'sales_rep')),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vehicles Inventory
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    vin VARCHAR(17) NOT NULL,
    stock_number VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2030),
    trim VARCHAR(100),
    body_type VARCHAR(50) NOT NULL CHECK (body_type IN ('Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Van', 'Wagon')),
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('Gasoline', 'Hybrid', 'Electric', 'Diesel', 'Plug-in Hybrid')),
    transmission VARCHAR(50) NOT NULL CHECK (transmission IN ('Automatic', 'Manual', 'CVT', 'Dual-Clutch')),
    exterior_color VARCHAR(50) NOT NULL,
    interior_color VARCHAR(50) DEFAULT 'Black',
    inventory_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_service', 'reserved', 'sold')),
    location_bay VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vin_per_dealer UNIQUE (dealership_id, vin),
    CONSTRAINT unique_stock_per_dealer UNIQUE (dealership_id, stock_number)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    preferred_contact VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact IN ('email', 'sms', 'phone')),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Service Appointments
CREATE TABLE IF NOT EXISTS service_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    assigned_advisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN (
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    )),
    bay_number INTEGER CHECK (bay_number BETWEEN 1 AND 12),
    estimated_duration_hours NUMERIC(3, 1) DEFAULT 1.5,
    estimated_cost NUMERIC(10, 2) DEFAULT 150.00,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
    service_notes TEXT,
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customer Follow-Ups
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('service_reminder', 'post_service_satisfaction', 'sales_inquiry', 'lease_expiry', 'warranty_check')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'completed', 'dismissed')),
    draft_message TEXT,
    channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'phone')),
    interaction_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Alerts (Generated by Inventory Intelligence Agent)
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('aging_critical', 'pricing_review', 'service_inspection_needed', 'low_inquiry_activity')),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    suggested_action VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Agent Actions (Structured with human approval workflow)
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'executed', 'failed')),
    target_entity_type VARCHAR(50) NOT NULL CHECK (target_entity_type IN ('vehicle', 'service_appointment', 'follow_up', 'inventory_alert')),
    target_entity_id VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    reasoning TEXT NOT NULL,
    impact_summary TEXT NOT NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Comprehensive Activity & Audit Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('agent', 'user', 'system')),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_status ON vehicles(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_inventory_date ON vehicles(inventory_date);
CREATE INDEX IF NOT EXISTS idx_service_dealer_date ON service_appointments(dealership_id, appointment_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_followups_dealer_status ON follow_ups(dealership_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_alerts_dealer_resolved ON inventory_alerts(dealership_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_dealer_date ON activity_logs(dealership_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies (scoped by dealership_id)
-- Profiles policy: user can access their dealership data
CREATE POLICY "Users can access their own dealership"
    ON dealerships FOR SELECT
    USING (id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can access profiles in their dealership"
    ON profiles FOR SELECT
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view vehicles in their dealership"
    ON vehicles FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage customers in their dealership"
    ON customers FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage service appointments in their dealership"
    ON service_appointments FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage followups in their dealership"
    ON follow_ups FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage alerts in their dealership"
    ON inventory_alerts FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage agent actions in their dealership"
    ON agent_actions FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view activity logs in their dealership"
    ON activity_logs FOR ALL
    USING (dealership_id IN (SELECT dealership_id FROM profiles WHERE id = auth.uid()));

