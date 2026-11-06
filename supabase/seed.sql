-- DealerOps AI Seed Data
-- Realistic automobile dealership data for testing and production seeding

-- 1. Main Dealership
INSERT INTO dealerships (id, name, code, address, city, state, zip, phone, email, timezone)
VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'Apex Automotive Group - Metro Center',
    'APEX-METRO',
    '7420 Motor City Boulevard',
    'Detroit',
    'MI',
    '48226',
    '+1 (313) 555-0199',
    'ops@apexautomotive.com',
    'America/Detroit'
) ON CONFLICT (id) DO NOTHING;

-- 2. Staff Profiles
INSERT INTO profiles (id, dealership_id, email, full_name, role, phone)
VALUES
    ('u1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'marcus.vance@apexautomotive.com', 'Marcus Vance', 'dealer_principal', '+1 (313) 555-0101'),
    ('u2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'sarah.jenkins@apexautomotive.com', 'Sarah Jenkins', 'operations_manager', '+1 (313) 555-0102'),
    ('u3333333-3333-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111', 'carlos.mendez@apexautomotive.com', 'Carlos Mendez', 'service_advisor', '+1 (313) 555-0103'),
    ('u4444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', 'elena.rostova@apexautomotive.com', 'Elena Rostova', 'sales_rep', '+1 (313) 555-0104')
ON CONFLICT (id) DO NOTHING;

-- 3. Realistic Vehicle Inventory
INSERT INTO vehicles (id, dealership_id, vin, stock_number, brand, model, year, trim, body_type, purchase_price, selling_price, mileage, fuel_type, transmission, exterior_color, interior_color, inventory_date, status, location_bay, notes)
VALUES
    ('v1010000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', '1G1YY26E865100001', 'STK-2024-001', 'Chevrolet', 'Corvette Stingray', 2024, '3LT Coupe', 'Coupe', 68500.00, 78900.00, 4200, 'Gasoline', 'Dual-Clutch', 'Torch Red', 'Jet Black', CURRENT_DATE - INTERVAL '14 days', 'available', 'Showroom Floor A1', 'Pristine condition, premium audio system.'),
    ('v1010000-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111', '5NMS23AE5RH200002', 'STK-2023-089', 'Hyundai', 'Santa Fe', 2023, 'Calligraphy AWD', 'SUV', 32000.00, 36800.00, 18500, 'Gasoline', 'Automatic', 'Stormy Sea Blue', 'Gray Leather', CURRENT_DATE - INTERVAL '72 days', 'available', 'Lot B Row 4', 'Aged inventory (>60 days). Recommend $900 price review.'),
    ('v1010000-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111', '1FTFW1ED6PF300003', 'STK-2024-015', 'Ford', 'F-150 Lightning', 2024, 'Lariat Extended Range', 'Truck', 62000.00, 69500.00, 6100, 'Electric', 'Automatic', 'Antimatter Blue', 'Medium Dark Slate', CURRENT_DATE - INTERVAL '21 days', 'available', 'Front Lot Row 1', 'EV truck with Ford Charge Station Pro included.'),
    ('v1010000-0000-0000-0000-000000000004', 'd1111111-1111-1111-1111-111111111111', 'WA1C2AFY5P2400004', 'STK-2023-044', 'Audi', 'Q5', 2023, '45 S line Premium Plus', 'SUV', 39000.00, 44200.00, 24100, 'Gasoline', 'Dual-Clutch', 'Glacier White Metallic', 'Okapi Brown', CURRENT_DATE - INTERVAL '85 days', 'available', 'Lot B Row 2', 'Critical aging (>75 days). High interest online but zero test drives logged.'),
    ('v1010000-0000-0000-0000-000000000005', 'd1111111-1111-1111-1111-111111111111', '3TYCZ5AN8PT500005', 'STK-2024-032', 'Toyota', 'Tacoma', 2024, 'TRD Off-Road Double Cab', 'Truck', 41500.00, 46995.00, 3200, 'Gasoline', 'Automatic', 'Underground Gray', 'Black/Red Fabric', CURRENT_DATE - INTERVAL '5 days', 'available', 'Front Lot Row 2', 'High-demand unit, recently arrived from trade-in.'),
    ('v1010000-0000-0000-0000-000000000006', 'd1111111-1111-1111-1111-111111111111', '4T1B11HK5PU600006', 'STK-2024-018', 'Toyota', 'Camry Hybrid', 2024, 'XLE', 'Sedan', 28500.00, 32450.00, 11200, 'Hybrid', 'CVT', 'Celestial Silver', 'Ash Leather', CURRENT_DATE - INTERVAL '38 days', 'available', 'Lot A Row 3', 'Great fuel economy, standard turn rate.'),
    ('v1010000-0000-0000-0000-000000000007', 'd1111111-1111-1111-1111-111111111111', 'JN1BV7EK9PM700007', 'STK-2023-071', 'Nissan', 'Rogue', 2023, 'Platinum AWD', 'SUV', 26000.00, 29800.00, 28900, 'Gasoline', 'CVT', 'Caspian Blue', 'Tan Quilted', CURRENT_DATE - INTERVAL '94 days', 'available', 'Lot C Back', 'Over 90 days. Carrying cost accumulating ($24/day). Requires immediate manager pricing action.'),
    ('v1010000-0000-0000-0000-000000000008', 'd1111111-1111-1111-1111-111111111111', 'WBA33AY05PFP80008', 'STK-2024-055', 'BMW', '330i xDrive', 2024, 'M Sport Package', 'Sedan', 42000.00, 48500.00, 7800, 'Gasoline', 'Automatic', 'Brooklyn Grey', 'Tacora Red Sensatec', CURRENT_DATE - INTERVAL '12 days', 'in_service', 'Service Bay 3', 'Pre-sale 150-point inspection in progress.'),
    ('v1010000-0000-0000-0000-000000000009', 'd1111111-1111-1111-1111-111111111111', '5YJ3E1EB2PF900009', 'STK-2024-061', 'Tesla', 'Model 3', 2023, 'Long Range AWD', 'Sedan', 31500.00, 35900.00, 19400, 'Electric', 'Automatic', 'Solid Black', 'All Black Premium', CURRENT_DATE - INTERVAL '29 days', 'reserved', 'Customer Pickup Bay', 'Deposit taken by Elena Rostova. Pending financing.'),
    ('v1010000-0000-0000-0000-000000000010', 'd1111111-1111-1111-1111-111111111110', '1HGCR2F83PA100010', 'STK-2023-012', 'Honda', 'Accord', 2023, 'Touring Hybrid', 'Sedan', 27000.00, 31200.00, 22000, 'Hybrid', 'CVT', 'Meteorite Gray Metallic', 'Black Leather', CURRENT_DATE - INTERVAL '49 days', 'available', 'Lot A Row 5', '49 days in stock. Approaching 60-day review threshold.')
ON CONFLICT (id) DO NOTHING;

-- 4. Realistic Customers
INSERT INTO customers (id, dealership_id, first_name, last_name, email, phone, preferred_contact, city, state, tags, notes)
VALUES
    ('c1010000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'Robert', 'Sterling', 'r.sterling@summitventures.com', '+1 (313) 555-4819', 'phone', 'Birmingham', 'MI', ARRAY['VIP', 'Repeat Buyer'], 'Purchased Corvette in 2021. Interested in 2024 Stingray.'),
    ('c1010000-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111', 'Jessica', 'Alvarez', 'jalvarez@medpartners.org', '+1 (313) 555-8912', 'email', 'Troy', 'MI', ARRAY['Service Club'], 'Frequent service client. Owns Audi Q5.'),
    ('c1010000-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111', 'David', 'Chen', 'david.chen@techaura.io', '+1 (248) 555-3312', 'sms', 'Ann Arbor', 'MI', ARRAY['EV Enthusiast'], 'Test drove Ford F-150 Lightning last week.'),
    ('c1010000-0000-0000-0000-000000000004', 'd1111111-1111-1111-1111-111111111111', 'Amanda', 'Kowalski', 'amanda.k@greatlakeslogistics.com', '+1 (586) 555-7721', 'email', 'Royal Oak', 'MI', ARRAY['Fleet Inquiry'], 'Looking for 3 utility vehicles.'),
    ('c1010000-0000-0000-0000-000000000005', 'd1111111-1111-1111-1111-111111111111', 'Gregory', 'Hayes', 'ghayes@detroitcapital.com', '+1 (313) 555-6604', 'phone', 'Grosse Pointe', 'MI', ARRAY['Executive'], 'Deposit placed on Tesla Model 3.')
ON CONFLICT (id) DO NOTHING;

-- 5. Service Appointments
INSERT INTO service_appointments (id, dealership_id, customer_id, vehicle_id, assigned_advisor_id, service_type, appointment_date, time_slot, bay_number, estimated_duration_hours, estimated_cost, status, service_notes)
VALUES
    ('s1010000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000002', 'v1010000-0000-0000-0000-000000000004', 'u3333333-3333-3333-3333-333333333333', 'Engine Diagnostics', CURRENT_DATE, '09:00 AM', 2, 2.0, 240.00, 'in_progress', 'Customer reported intermittent check engine light under acceleration.'),
    ('s1010000-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000001', 'v1010000-0000-0000-0000-000000000001', 'u3333333-3333-3333-3333-333333333333', 'Oil & Filter', CURRENT_DATE + INTERVAL '1 day', '10:00 AM', 4, 1.0, 129.99, 'scheduled', 'Mobil 1 Full Synthetic oil replacement + 21-point safety inspection.'),
    ('s1010000-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000003', 'v1010000-0000-0000-0000-000000000003', 'u3333333-3333-3333-3333-333333333333', 'Brake System', CURRENT_DATE - INTERVAL '2 days', '02:00 PM', 1, 2.5, 380.00, 'overdue', 'Customer rescheduled twice; now overdue for safety brake fluid flush and pad inspection.')
ON CONFLICT (id) DO NOTHING;

-- 6. Customer Follow-Ups
INSERT INTO follow_ups (id, dealership_id, customer_id, vehicle_id, assigned_to, type, priority, due_date, status, draft_message, channel)
VALUES
    ('f1010000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000003', 'v1010000-0000-0000-0000-000000000003', 'u4444444-4444-4444-4444-444444444444', 'sales_inquiry', 'high', CURRENT_DATE - INTERVAL '1 day', 'pending', 'Hi David, thanks for test driving the 2024 F-150 Lightning! We have our manager incentives ending this weekend. Would you like to review commercial charging credits?', 'sms'),
    ('f1010000-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000001', 'v1010000-0000-0000-0000-000000000001', 'u4444444-4444-4444-4444-444444444444', 'sales_inquiry', 'high', CURRENT_DATE, 'pending', 'Dear Mr. Sterling, following up on your inquiry on the 2024 Corvette Stingray 3LT. We can offer a complimentary first-year track maintenance package if finalized by Friday.', 'email'),
    ('f1010000-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111', 'c1010000-0000-0000-0000-000000000002', 'v1010000-0000-0000-0000-000000000004', 'u3333333-3333-3333-3333-333333333333', 'post_service_satisfaction', 'medium', CURRENT_DATE + INTERVAL '2 days', 'pending', 'Hi Jessica, we hope your Audi Q5 is running smoothly following diagnostics. Please let our service team know if you noticed any remaining warning lights.', 'email')
ON CONFLICT (id) DO NOTHING;

-- 7. Inventory Alerts
INSERT INTO inventory_alerts (id, dealership_id, vehicle_id, alert_type, severity, title, message, reasoning, suggested_action, is_resolved)
VALUES
    ('a1010000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'v1010000-0000-0000-0000-000000000007', 'aging_critical', 'critical', 'Extreme Aging: Nissan Rogue (94 Days)', 'Stock STK-2023-071 has exceeded 90 days in inventory. Holding cost is eroding gross margin.', 'Industry standard benchmark is under 45 days. Daily inventory carrying cost estimated at $24.70/day ($2,321 accumulated). Margin spread currently $3,800.', 'Apply price markdown of $1,200 and re-feature in certified pre-owned newsletter.', false),
    ('a1010000-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111', 'v1010000-0000-0000-0000-000000000004', 'aging_critical', 'high', 'Aging Warning: Audi Q5 (85 Days)', 'Stock STK-2023-044 has been in lot for 85 days with zero test drives recorded this month.', 'Online views are above median (142 impressions), but lead-to-appointment conversion is 0%. Suggests price resistance or photo quality issue.', 'Reposition to front showroom row and review price down by $1,000.', false),
    ('a1010000-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111', 'v1010000-0000-0000-0000-000000000002', 'pricing_review', 'medium', 'Stagnant Activity: Hyundai Santa Fe (72 Days)', 'Vehicle has been on lot 72 days. Competitor listings have shifted.', 'Current listing price is $36,800. Margin buffer is $4,800. Fast sale at $35,900 would free up capital.', 'Authorize $900 price reduction to trigger portal price-drop alerts.', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Pending Agent Action
INSERT INTO agent_actions (id, dealership_id, user_id, action_type, status, target_entity_type, target_entity_id, parameters, reasoning, impact_summary)
VALUES
    ('act10000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'u2222222-2222-2222-2222-222222222222', 'inventory_markdown', 'pending_approval', 'vehicle', 'v1010000-0000-0000-0000-000000000007', '{"new_price": 28600.00, "current_price": 29800.00, "discount_amount": 1200.00}'::jsonb, 'Vehicle has exceeded 90 days inventory threshold. Holding cost of $24/day exceeds expected margin gain from waiting.', 'Reduces list price by $1,200 (-4.0%). Leaves $2,600 gross margin while stimulating search ranking.')
ON CONFLICT (id) DO NOTHING;

