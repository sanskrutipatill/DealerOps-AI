'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingDown,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Send,
  FileCheck,
} from 'lucide-react';
import { InventoryAlert, AgentAction, Vehicle } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryIntelligencePage() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ count: number; alertsCreated: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, vehRes] = await Promise.all([
        fetch('/api/agent/scan'), // returns inventory scan
        fetch('/api/inventory?status=available'),
      ]);
      const alertsData = await alertsRes.json();
      const vehData = await vehRes.json();

      setAlerts(alertsData.data?.generatedAlerts || []);
      setVehicles(vehData.vehicles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runOnDemandScan = async () => {
    try {
      setScanning(true);
      const res = await fetch('/api/agent/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScanResult({
          count: data.data.inspectedVehicles,
          alertsCreated: data.data.generatedAlerts.length,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-white rounded">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inventory Intelligence Agent
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                Rule-Bounded Algorithmic Auditing
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autonomous lot analysis calculating carrying cost erosion, stagnant turn rates, and prioritized manager recommendations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runOnDemandScan}
              disabled={scanning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Auditing Lot Units...' : 'Run Autonomous Scan'}</span>
            </button>
          </div>
        </div>

        {/* Scan Results Banner */}
        {scanResult && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-lg flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Diagnostic Scan Complete: Inspected <strong>{scanResult.count} vehicles</strong>. Identified{' '}
                <strong>{scanResult.alertsCreated} priority attention items</strong>.
              </span>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Diagnostic KPI Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Lot Carrying Cost Rate</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">$24.50 / vehicle / day</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Floorplan interest, insurance, depreciation &amp; space
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Aged Inventory (&gt;60 Days)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-700">3 Vehicles on Lot</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Representing $110,800 in tied-up dealership capital
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Critical Attention (&gt;90 Days)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-700">1 Vehicle Exceeded</div>
            <div className="text-[11px] text-rose-700 font-semibold mt-1">
              Nissan Rogue STK-2023-071 (94 days)
            </div>
          </div>
        </div>

        {/* Priority Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Severity Filter:
            </span>
            <div className="flex items-center space-x-1">
              {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded capitalize font-medium ${
                    severityFilter === sev
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            Showing {filteredAlerts.length} actionable alert(s)
          </span>
        </div>

        {/* Alerts & Recommendation Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              Running inventory intelligence audit...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">Inventory Operating in Optimal Turn</h4>
              <p className="text-slate-500 mt-1">No vehicles currently exceed aging risk thresholds.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        alert.severity === 'critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : alert.severity === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      {alert.severity} PRIORITY
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Alert Ref: {alert.id.slice(0, 8)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 block">
                      Operational Problem &amp; Diagnosis:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{alert.message}</p>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 mt-2">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Underlying Financial Reasoning:
                      </span>
                      <p className="mt-0.5 leading-relaxed">{alert.reasoning}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block">
                        Autonomous Recommendation:
                      </span>
                      <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-950 p-3 rounded text-xs leading-relaxed font-medium">
                        {alert.suggested_action}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Requires Manager Approval
                      </span>
                      <Link
                        href="/agent"
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Review in AI Agent</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

