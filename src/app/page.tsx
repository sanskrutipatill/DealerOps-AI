'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Car,
  Clock,
  Wrench,
  Users,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('30d');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Aging bracket distribution for chart
  const agingData = [
    { name: '< 30 Days (Fresh)', count: 6, fill: '#059669' },
    { name: '30-59 Days (Normal)', count: 3, fill: '#d97706' },
    { name: '60-89 Days (High)', count: 2, fill: '#ea580c' },
    { name: '90+ Days (Critical)', count: 1, fill: '#dc2626' },
  ];

  // Service throughput weekly trend
  const throughputTrend = [
    { day: 'Mon', completed: 8, scheduled: 10, revenue: 1420 },
    { day: 'Tue', completed: 11, scheduled: 12, revenue: 2150 },
    { day: 'Wed', completed: 9, scheduled: 11, revenue: 1680 },
    { day: 'Thu', completed: 14, scheduled: 14, revenue: 2900 },
    { day: 'Fri', completed: 12, scheduled: 13, revenue: 2450 },
    { day: 'Sat', completed: 15, scheduled: 16, revenue: 3200 },
    { day: 'Sun', completed: 0, scheduled: 0, revenue: 0 },
  ];

  const appointmentStatusData = [
    { name: 'Scheduled', value: 2, color: '#2563eb' },
    { name: 'In Progress', value: 1, color: '#059669' },
    { name: 'Completed', value: 1, color: '#64748b' },
    { name: 'Overdue', value: 1, color: '#dc2626' },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Title & Time Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dealership Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time operational throughput, inventory aging metrics, and service bay performance.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-600 flex items-center space-x-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timeRange}
                onChange={(e: any) => setTimeRange(e.target.value)}
                className="bg-transparent focus:outline-none font-medium cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Current Month (30d)</option>
                <option value="quarter">Q4 2024</option>
              </select>
            </div>
            <button
              onClick={fetchMetrics}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 8 Core KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Total Vehicles */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Inventory</span>
              <Car className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? metrics.totalVehicles : '12'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Retail Value:</span>
              <span className="font-semibold text-slate-700">
                {metrics ? formatCurrency(metrics.totalInventoryValue) : '$534,445'}
              </span>
            </div>
          </div>

          {/* 2. Available Inventory */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Available on Lot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? metrics.availableVehicles : '10'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Margin Potential:</span>
              <span className="font-semibold text-emerald-700">
                {metrics ? formatCurrency(metrics.potentialMargin) : '$66,545'}
              </span>
            </div>
          </div>

          {/* 3. In Service Vehicles */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Vehicles in Service</span>
              <Wrench className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? metrics.inServiceVehicles : '1'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active in pre-delivery & bay inspection
            </div>
          </div>

          {/* 4. Average Inventory Age */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Average Age on Lot</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? `${metrics.avgInventoryAge} d` : '42 d'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span className="text-amber-600 font-semibold">
                {metrics?.agingOver60Days || 2} units
              </span>
              <span>exceed 60 days</span>
            </div>
          </div>

          {/* 5. Upcoming Appointments */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Upcoming Service</span>
              <Wrench className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? metrics.upcomingAppointments : '2'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Scheduled across 5 technician bays
            </div>
          </div>

          {/* 6. Overdue Service / Tasks */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Overdue Follow-ups</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono">
              {metrics ? metrics.overdueFollowUps : '1'}
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-medium">
              Requires immediate advisor contact
            </div>
          </div>

          {/* 7. Monthly Sales Revenue */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Monthly Retail Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? formatCurrency(metrics.monthlySalesRevenue) : '$428,500'}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              +8.4% vs previous month
            </div>
          </div>

          {/* 8. Service Performance */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Service Efficiency</span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics ? `${metrics.serviceThroughputRate}%` : '94.2%'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              On-time vehicle completion rate
            </div>
          </div>
        </div>

        {/* Charts Section: Inventory Aging & Service Throughput */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Aging Distribution Bar Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Inventory Aging Distribution
                </h3>
                <p className="text-[11px] text-slate-500">
                  Unit counts grouped by lot duration days. Benchmark ceiling is 60 days.
                </p>
              </div>
              <Link
                href="/inventory"
                className="text-xs text-slate-700 font-semibold hover:underline flex items-center"
              >
                View Inventory &rarr;
              </Link>
            </div>

            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Carrying cost formula: $24.50/day holding expense</span>
              <span className="font-medium text-rose-700">
                1 vehicle over 90 days requires markdown
              </span>
            </div>
          </div>

          {/* Service Bay Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Appointment Pipeline
                </h3>
                <p className="text-[11px] text-slate-500">Service department status breakdown</p>
              </div>
              <Link
                href="/service"
                className="text-xs text-slate-700 font-semibold hover:underline"
              >
                Schedule &rarr;
              </Link>
            </div>

            <div className="h-56 mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              {appointmentStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-600 text-[11px]">{item.name}:</span>
                  <span className="font-semibold text-slate-900 text-[11px]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Shortcuts & AI Agent Assistant Prompt Bar */}
        <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold tracking-wide">
                AI Operations Agent is Ready
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Ask business questions in natural language, draft customer follow-ups, or request inventory markdowns with audit-logged execution.
            </p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Link
              href="/agent"
              className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded text-xs transition-colors flex items-center justify-center space-x-1.5 w-full md:w-auto shadow-xs"
            >
              <span>Open AI Operations Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

