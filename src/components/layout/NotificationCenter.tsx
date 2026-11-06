'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { InventoryAlert, AgentAction, ServiceAppointment, FollowUp } from '@/types';
import Link from 'next/link';

interface NotificationCenterProps {
  onClose?: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [overdueAppointments, setOverdueAppointments] = useState<ServiceAppointment[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<'all' | 'approvals' | 'aging' | 'overdue'>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actionsRes, alertsRes, serviceRes, followupsRes] = await Promise.all([
        fetch('/api/agent/actions?status=pending_approval'),
        fetch('/api/agent/scan'), // retrieves alerts
        fetch('/api/service?status=overdue'),
        fetch('/api/followups?isOverdue=true'),
      ]);

      const actionsData = await actionsRes.json();
      const serviceData = await serviceRes.json();
      const followupsData = await followupsRes.json();

      setPendingActions(actionsData.actions || []);
      setOverdueAppointments(serviceData.appointments || []);
      setOverdueFollowups(followupsData.followups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCount =
    pendingActions.length +
    alerts.length +
    overdueAppointments.length +
    overdueFollowups.length;

  return (
    <div className="w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-slate-300" />
          <h3 className="text-sm font-semibold tracking-wide">Notification Center</h3>
          {totalCount > 0 && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold' : 'hover:text-slate-900'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('approvals')}
          className={`px-3 py-1.5 rounded ${
            filter === 'approvals' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold' : 'hover:text-slate-900'
          }`}
        >
          Approvals ({pendingActions.length})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-3 py-1.5 rounded ${
            filter === 'overdue' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold' : 'hover:text-slate-900'
          }`}
        >
          Overdue ({overdueAppointments.length + overdueFollowups.length})
        </button>
      </div>

      {/* Content List */}
      <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading alerts...</div>
        ) : totalCount === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">All Operations Clear</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No pending actions or overdue alerts.</p>
          </div>
        ) : (
          <>
            {/* Pending Approvals Section */}
            {(filter === 'all' || filter === 'approvals') &&
              pendingActions.map((action) => (
                <div key={action.id} className="pt-2 first:pt-0">
                  <div className="bg-amber-50/60 border border-amber-200 rounded p-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
                        <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Manager Approval Required</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-700">
                        {action.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 line-clamp-2">{action.reasoning}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Impact: {action.impact_summary}</span>
                      <Link
                        href="/agent"
                        onClick={onClose}
                        className="text-slate-900 font-semibold hover:underline inline-flex items-center"
                      >
                        Review <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

            {/* Overdue Service Appointments */}
            {(filter === 'all' || filter === 'overdue') &&
              overdueAppointments.map((appt) => (
                <div key={appt.id} className="pt-2 first:pt-0">
                  <div className="bg-rose-50/60 border border-rose-200 rounded p-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                        <span>Overdue Service Appointment</span>
                      </div>
                      <span className="text-[10px] text-rose-700">{appt.appointment_date}</span>
                    </div>
                    <p className="text-xs text-slate-800 mt-1">
                      {appt.customer?.first_name} {appt.customer?.last_name} – {appt.service_type}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {appt.vehicle?.year} {appt.vehicle?.brand} {appt.vehicle?.model}
                    </p>
                    <div className="mt-2 text-right">
                      <Link
                        href="/service"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-rose-800 hover:underline"
                      >
                        Reschedule Appointment &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

            {/* Overdue Follow-ups */}
            {(filter === 'all' || filter === 'overdue') &&
              overdueFollowups.map((fu) => (
                <div key={fu.id} className="pt-2 first:pt-0">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Overdue Lead Follow-up</span>
                      </div>
                      <span className="text-[10px] text-rose-600 font-semibold">Due {fu.due_date}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {fu.customer?.first_name} {fu.customer?.last_name} ({fu.customer?.phone || 'No phone'})
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                      "{fu.draft_message}"
                    </p>
                    <div className="mt-2 text-right">
                      <Link
                        href="/followups"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-slate-900 hover:underline"
                      >
                        Send Outreach &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>DealerOps AI v1.0</span>
        <button
          onClick={fetchData}
          className="text-slate-700 font-medium hover:text-slate-900"
        >
          Refresh Feed
        </button>
      </div>
    </div>
  );
}

