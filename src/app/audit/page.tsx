'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  ShieldCheck,
  Terminal,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  Bot,
  User,
  Sliders,
  ChevronRight,
  Database,
} from 'lucide-react';
import { ActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState<'all' | 'agent' | 'user' | 'system'>('all');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actorFilter !== 'all' && log.actor_type !== actorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(q);
      const detailsMatch = JSON.stringify(log.details).toLowerCase().includes(q);
      return actionMatch || detailsMatch;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-white rounded">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Activity &amp; AI Agent Audit Log
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                Immutable Operation History
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete visibility into autonomous reasoning, database queries executed, parameters inspected, and staff actions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter actions, parameters, or vehicle IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-slate-900 placeholder:text-slate-400 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Actor Type:</span>
            <div className="flex items-center space-x-1">
              {(['all', 'agent', 'user', 'system'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActorFilter(type)}
                  className={`px-2.5 py-1 rounded capitalize font-medium ${
                    actorFilter === type
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Timeline Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Parameters &amp; Database State Inspected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                      Loading audit records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-sans">
                      No audit logs match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                        {formatDateTime(log.created_at)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.actor_type === 'agent'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.actor_type === 'user'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.actor_type === 'agent' && <Bot className="w-2.5 h-2.5 mr-0.5" />}
                          {log.actor_type === 'user' && <User className="w-2.5 h-2.5 mr-0.5" />}
                          <span>{log.actor_type}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 text-[11px]">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 text-slate-700 text-[11px]">
                        <pre className="bg-slate-50 p-2 rounded border border-slate-200 max-w-xl overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

