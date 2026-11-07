# DealerOps AI – Intelligent Dealership Operations Platform

DealerOps AI is an enterprise-grade automobile dealership operations management platform built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL, and Google's Gemini AI Agent architecture.

Designed intentionally for human operations managers, dealer principals, service advisors, and sales teams, the platform replaces repetitive manual dealership tasks across vehicle inventory, service bay scheduling, customer CRM follow-ups, and executive business reporting.

---

## Key Capabilities

1. **AI Operations Agent (Core Feature)**:
   - Natural language comprehension powered by Gemini with structured tool declarations (`query_inventory`, `query_service_appointments`, `query_customer_followups`, `get_operations_summary`, `identify_aging_inventory`, `draft_followup_message`, `schedule_service_appointment`, `request_action_approval`).
   - Zero unrestricted SQL execution; bound strictly to schema-validated endpoints.
   - Separation of concerns: AI reasoning $\to$ Tool calling $\to$ Backend validation $\to$ Database query $\to$ Manager approval $\to$ Action execution.
   - Human-in-the-loop approval workflow: Consequential operations (price markdowns, customer messages, service appointments) generate pending tickets requiring manager approval.
   - Complete audit trail logging every tool execution, timing, parameters, and database records inspected.

2. **Operations Dashboard**:
   - Real-time KPIs: Total vehicles, available inventory, vehicles in service, upcoming appointments, overdue follow-ups, average inventory age, monthly retail revenue, and service throughput.
   - Interactive Recharts analytics: 4-tier inventory aging distribution and appointment status pipeline.
   - Date range selector and quick actions.

3. **Inventory Management**:
   - Complete inventory CRUD with VIN, stock number, brand, model, year, trim, body type, purchase/selling price, mileage, powertrain, transmission, color, location bay, and intake date.
   - Real-time lot aging calculations with severity badges (`<30d`, `30-59d`, `60-89d`, `90+d`).
   - Multi-parameter search, status filtering, powertrain filtering, and sorting.
   - Vehicle inspection drawer detailing specs, margin spread, and accumulated holding costs ($24.50/day).
   - Validated CSV import and export.

4. **Service Appointment Management & Conflict Prevention Engine**:
   - Comprehensive service intake workflow (Scheduled Maintenance, Brake System, Oil & Filter, Diagnostics, Tire Rotation, etc.).
   - **Conflict Prevention Engine**: Prevents double-booking service advisors and prevents scheduling collisions in technician bays in real time.
   - State transition pipeline (`scheduled` $\to$ `in_progress` $\to$ `completed` $\to$ `overdue`).

5. **Inventory Intelligence Agent**:
   - Autonomous and on-demand diagnostic engine scanning inventory for aging ($>60$ and $>90$ days), margin compression, and stagnant turn rates.
   - Calculates exact daily carrying costs ($24.50/day floorplan holding cost) without hallucinating market prices.
   - Prioritizes strategic recommendations (Critical, High, Medium, Low) with one-click action stages.

6. **Customer Follow-up Automation**:
   - Identifies high-intent prospects and overdue CRM touchpoints.
   - AI-composed personalized SMS and email drafts contextualized to vehicle test drives and service history.
   - Human-in-the-loop review and dispatch controls.
   - Persistent interaction history timeline.

7. **Report Generation**:
   - Generates Daily Operations Reports, Monthly Performance Reports, Inventory Aging Reports, Service Appointment Reports, and Customer Follow-up Reports.
   - Interactive charts and downloadable CSV files for all report types.
   - Print preview optimization.

8. **Notification Center**:
   - Slide-over notification drawer with unread badges.
   - Categorized alerts: Manager approvals, overdue service, and overdue CRM follow-ups.

9. **Multi-Tenant Dealership Isolation & Database Design**:
   - Normalized PostgreSQL schema with foreign keys, checks, indexes, and Row Level Security (RLS) policies scoped by `dealership_id`.
   - Realistic seed dataset ready for immediate use.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server & Client Components) |
| **Language** | TypeScript (Strict Mode) |
| **Styling & UI** | Tailwind CSS (Enterprise neutral charcoal & slate palette) |
| **Database** | Supabase PostgreSQL (with RLS & migrations) + Resilient Store |
| **AI Operations Agent** | Google Gemini API (Function Calling & Structured Output) |
| **Charts & Analytics** | Recharts |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Testing** | Vitest |
| **Deployment** | Vercel |

---

## Agent Architecture

```
User Query ("Show all vehicles in inventory for more than 30 days")
      │
      ▼
┌────────────────────────────────────────────────────────┐
│  AI Operations Agent (Gemini Function Calling)         │
│  - Natural language intent classification              │
│  - Persona bounded to dealership operations            │
│  - Strict tool declaration schema                      │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼ Controlled Tool Call
┌────────────────────────────────────────────────────────┐
│  Backend Tool Execution Layer                          │
│  - query_inventory({ minAgeDays: 30 })                 │
│  - checkAppointmentConflict({ bay, advisor, date })    │
│  - identify_aging_inventory({ threshold: 60 })         │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼ Validated Query
┌────────────────────────────────────────────────────────┐
│  Database Access Layer (db.ts / Supabase PostgreSQL)   │
│  - Row-Level Security (RLS)                            │
│  - Multi-tenant dealership isolation                   │
│  - Immutable Activity & Audit Logging                  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼ Consequential Action?
             ┌──────────┴──────────┐
             │                     │
          No │                 Yes │
             ▼                     ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│ Direct Agent Response   │   │ Staged in Manager Queue   │
│ - Data tables & badges  │   │ - Human review & sign-off │
│ - Numbered next actions │   │ - "Approve & Execute" btn │
└─────────────────────────┘   └───────────────────────────┘
```

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Module 2: Operations Dashboard
│   │   ├── agent/page.tsx            # Module 4: AI Operations Agent
│   │   ├── inventory/page.tsx        # Module 3: Inventory Management
│   │   ├── service/page.tsx          # Module 5: Service Appointments
│   │   ├── intelligence/page.tsx     # Module 6: Inventory Intelligence Agent
│   │   ├── followups/page.tsx        # Module 7: Customer Follow-ups
│   │   ├── reports/page.tsx          # Module 8: Report Generation & CSV
│   │   ├── audit/page.tsx            # Module 10: Audit & Activity Log
│   │   └── api/                      # Next.js Server API Routes
│   │       ├── agent/chat/route.ts   # AI agent conversational endpoint
│   │       ├── agent/actions/route.ts# Approvals workflow
│   │       ├── agent/scan/route.ts   # Inventory intelligence scan
│   │       ├── inventory/route.ts    # Inventory CRUD
│   │       ├── service/route.ts      # Service scheduling & conflict engine
│   │       ├── followups/route.ts    # CRM follow-up management
│   │       ├── reports/route.ts      # Aggregated reports & CSV downloads
│   │       └── audit/route.ts        # Immutable activity log
│   ├── components/
│   │   └── layout/
│   │       ├── AppShell.tsx          # Enterprise responsive navigation & role switcher
│   │       └── NotificationCenter.tsx# Alert popover & approval queue
│   ├── lib/
│   │   ├── db.ts                     # Database layer (Supabase + fallback)
│   │   ├── gemini.ts                 # Gemini tool definitions & reasoning engine
│   │   ├── mockData.ts               # Realistic automobile dealership seed dataset
│   │   ├── supabase.ts               # Supabase PostgreSQL client
│   │   └── utils.ts                  # Currency, date, aging calculators
│   ├── types/
│   │   └── index.ts                  # Comprehensive TypeScript interfaces
│   └── __tests__/
│       └── dealerops.test.ts         # Vitest business workflow test suite
├── supabase/
│   ├── migrations/
│   │   └── 20250101_initial_schema.sql # PostgreSQL DDL with RLS
│   └── seed.sql                      # Realistic automobile dealership seed data
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## Environment Variables Configuration

Create a `.env.local` file based on `.env.example`:

```bash
# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Gemini API Key (AI Operations Agent)
GEMINI_API_KEY=your-gemini-api-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: The application includes a resilient offline storage layer initialized with the complete realistic seed dataset. You can launch and test all features immediately even before providing remote Supabase credentials.

---

## Quickstart & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run business logic test suite**:
   ```bash
   npm run test
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run production build**:
   ```bash
   npm run build
   npm run start
   ```

---

## Database Migration (Supabase PostgreSQL)

To apply the schema and seed data to your live Supabase project:

1. Open your Supabase Project Dashboard $\to$ **SQL Editor**.
2. Run the migration script in [`supabase/migrations/20250101_initial_schema.sql`](supabase/migrations/20250101_initial_schema.sql).
3. Run the seed data script in [`supabase/seed.sql`](supabase/seed.sql).
4. Copy your project URL and anon public key into `.env.local`.

---

## Vercel Deployment

1. Push your repository to GitHub.
2. In Vercel, click **Import Project** and select your GitHub repository.
3. In **Environment Variables**, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Click **Deploy**. Vercel will automatically build and publish DealerOps AI.

