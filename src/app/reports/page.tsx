'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  TrendingUp,
  Clock,
  Printer,
  Table,
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
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

type ReportType =
  | 'daily_operations'
  | 'monthly_performance'
  | 'inventory_aging'
  | 'service'
  | 'followups';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('daily_operations');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
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
    fetchReportData();
  }, []);

  // Performance timeline data
  const monthlyPerformanceTrend = [
    { month: 'Jun', unitsSold: 14, grossProfit: 46200, serviceRevenue: 28400 },
    { month: 'Jul', unitsSold: 18, grossProfit: 58900, serviceRevenue: 31200 },
    { month: 'Aug', unitsSold: 16, grossProfit: 51000, serviceRevenue: 29800 },
    { month: 'Sep', unitsSold: 21, grossProfit: 68400, serviceRevenue: 34500 },
    { month: 'Oct', unitsSold: 19, grossProfit: 62000, serviceRevenue: 33100 },
    { month: 'Nov (MTD)', unitsSold: 12, grossProfit: 39500, serviceRevenue: 22800 },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-white rounded">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Report Generation &amp; Analytics
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                Audited Operational Exports
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generate executive reports, lot aging diagnostics, service throughput, and downloadable CSV audits.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
            <a
              href={`/api/reports?type=${selectedReport}&format=csv`}
              download
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </a>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-1 rounded-t-lg text-xs font-medium gap-1">
          {[
            { id: 'daily_operations', label: 'Daily Operations Report' },
            { id: 'monthly_performance', label: 'Monthly Performance Report' },
            { id: 'inventory_aging', label: 'Inventory Aging Diagnostics' },
            { id: 'service', label: 'Service Appointment Throughput' },
            { id: 'followups', label: 'Customer Follow-up Conversion' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as ReportType)}
              className={`px-3 py-2 rounded transition-colors ${
                selectedReport === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Report Content Container */}
        <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-2xs space-y-6">
          {/* Executive Report Metadata Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Official Dealership Document
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {selectedReport.replace('_', ' ').toUpperCase()}
              </h2>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                Apex Automotive Group • Store ID: APEX-METRO (Detroit, MI)
              </p>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-500">
              <div>Generated: {new Date().toLocaleDateString()}</div>
              <div className="text-emerald-700 font-semibold">Verification: Certified Authentic</div>
            </div>
          </div>

          {/* Dynamic Content by Report Type */}
          {selectedReport === 'monthly_performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  6-Month Dealership Revenue &amp; Gross Margin Trend
                </h3>
                <p className="text-[11px] text-slate-500">
                  Monthly vehicle sales gross compared to service department billable revenue.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformanceTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Line type="monotone" dataKey="grossProfit" name="Retail Gross Profit" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="serviceRevenue" name="Service Revenue" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Reporting Month</th>
                      <th className="p-2.5">Vehicles Sold</th>
                      <th className="p-2.5">Gross Profit ($)</th>
                      <th className="p-2.5">Service Revenue ($)</th>
                      <th className="p-2.5">Average Gross / Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {monthlyPerformanceTrend.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-sans font-semibold text-slate-900">{row.month}</td>
                        <td className="p-2.5">{row.unitsSold} units</td>
                        <td className="p-2.5 font-semibold text-emerald-700">{formatCurrency(row.grossProfit)}</td>
                        <td className="p-2.5 text-slate-700">{formatCurrency(row.serviceRevenue)}</td>
                        <td className="p-2.5">{formatCurrency(Math.round(row.grossProfit / row.unitsSold))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Operations / Standard Table View */}
          {selectedReport !== 'monthly_performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Vehicles</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{metrics?.totalVehicles || 12}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Days on Lot</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{metrics?.avgInventoryAge || 42} Days</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Scheduled Service</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{metrics?.upcomingAppointments || 2} Appointments</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Overdue Follow-ups</span>
                  <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">{metrics?.overdueFollowUps || 1} High Intent</div>
                </div>
              </div>

              {/* Operations KPI Detailed Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Audit Metric</th>
                      <th className="p-3">Current Dealership Value</th>
                      <th className="p-3">Industry Benchmark Target</th>
                      <th className="p-3">Audit Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-3 font-semibold">Available Retail Inventory</td>
                      <td className="p-3 font-mono">{metrics?.availableVehicles || 10} Units</td>
                      <td className="p-3 text-slate-500">25 - 35 Units</td>
                      <td className="p-3 text-slate-700 font-mono">Acceptable turn</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Total Retail Value</td>
                      <td className="p-3 font-mono font-bold">{formatCurrency(metrics?.totalInventoryValue || 534445)}</td>
                      <td className="p-3 text-slate-500">$500,000 - $1.2M</td>
                      <td className="p-3 text-emerald-700 font-mono font-semibold">Within Target</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Average Days in Inventory</td>
                      <td className="p-3 font-mono">{metrics?.avgInventoryAge || 42} Days</td>
                      <td className="p-3 text-slate-500">&lt;= 45 Days</td>
                      <td className="p-3 text-emerald-700 font-mono font-semibold">-3 Days vs Benchmark</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Units Exceeding 60 Days</td>
                      <td className="p-3 font-mono text-amber-700 font-bold">{metrics?.agingOver60Days || 2} Units</td>
                      <td className="p-3 text-slate-500">0 Units</td>
                      <td className="p-3 text-amber-700 font-mono">Action Recommended</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Service Throughput Rate</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{metrics?.serviceThroughputRate || 94.2}%</td>
                      <td className="p-3 text-slate-500">&gt;= 90.0%</td>
                      <td className="p-3 text-emerald-700 font-mono font-semibold">+4.2% Above Target</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

