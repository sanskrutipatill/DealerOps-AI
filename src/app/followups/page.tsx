'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  Clock,
  Send,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  X,
  Edit,
  History,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { FollowUp, FollowUpStatus, FollowUpPriority } from '@/types';
import { formatDate } from '@/lib/utils';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<FollowUp | null>(null);
  const [draftText, setDraftText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [historyDrawerItem, setHistoryDrawerItem] = useState<FollowUp | null>(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/followups${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      const data = await res.json();
      setFollowups(data.followups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [statusFilter]);

  const handleOpenEdit = (item: FollowUp) => {
    setEditingItem(item);
    setDraftText(item.draft_message);
  };

  const handleSaveDraft = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch('/api/followups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem.id, draftMessage: draftText }),
      });
      if (!res.ok) throw new Error('Failed to save message draft');
      setMessage({ text: 'Draft message updated successfully.', type: 'success' });
      setEditingItem(null);
      fetchFollowUps();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    }
  };

  // Human approval & dispatch action
  const handleApproveAndSend = async (item: FollowUp) => {
    try {
      const res = await fetch('/api/followups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'sent',
          outcomeNote: `Message dispatched via ${item.channel.toUpperCase()} to customer (${item.customer?.phone || item.customer?.email}).`,
        }),
      });
      if (!res.ok) throw new Error('Dispatch failed');
      setMessage({ text: `Message dispatched to ${item.customer?.first_name} ${item.customer?.last_name}. Logged to interaction history.`, type: 'success' });
      fetchFollowUps();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-white rounded">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Customer Follow-up Automation
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                Human-Approved Outreach
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              AI-composed customer communications with high-intent lead prioritization and interaction audit history.
            </p>
          </div>
        </div>

        {/* Global Toast */}
        {message && (
          <div
            className={`p-3 rounded text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Status Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Outreach Tasks</option>
              <option value="pending">Pending Human Approval</option>
              <option value="sent">Dispatched / Sent</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Safety Constraint: No automated unapproved broadcasts
          </div>
        </div>

        {/* Follow-up Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              Loading customer follow-ups...
            </div>
          ) : followups.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              No follow-up items found.
            </div>
          ) : (
            followups.map((item) => {
              const isOverdue =
                item.due_date < new Date().toISOString().split('T')[0] && item.status === 'pending';

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-lg p-5 shadow-2xs flex flex-col justify-between space-y-3 transition-colors ${
                    isOverdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header: Customer & Priority Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.customer
                              ? `${item.customer.first_name} ${item.customer.last_name}`
                              : 'Customer Record'}
                          </h3>
                          {isOverdue && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>{item.customer?.phone || 'No phone'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-700">
                            {item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : 'General Inquiry'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            item.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority} INTENT
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Channel: {item.channel.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* AI Draft Message Preview Box */}
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <span className="flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-slate-600" />
                          <span>AI Personalized Draft</span>
                        </span>
                        <span className="text-slate-400 font-mono">Due: {item.due_date}</span>
                      </div>
                      <p className="text-slate-800 italic leading-relaxed">
                        "{item.draft_message}"
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setHistoryDrawerItem(item)}
                        className="text-slate-500 hover:text-slate-800 flex items-center space-x-1 text-[11px]"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>History ({item.interaction_history?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-slate-500 hover:text-slate-800 flex items-center space-x-1 text-[11px]"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Draft</span>
                      </button>
                    </div>

                    <div>
                      {item.status === 'pending' ? (
                        <button
                          onClick={() => handleApproveAndSend(item)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                        >
                          <Send className="w-3 h-3 text-emerald-400" />
                          <span>Approve &amp; Dispatch</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Dispatched</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Draft Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Refine Personalized Customer Message
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <p className="text-slate-500">
                  Recipient: <strong>{editingItem.customer?.first_name} {editingItem.customer?.last_name}</strong> ({editingItem.channel.toUpperCase()})
                </p>

                <textarea
                  rows={5}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                  >
                    Save Draft Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interaction History Drawer */}
        {historyDrawerItem && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  CRM Interaction History
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {historyDrawerItem.customer?.first_name} {historyDrawerItem.customer?.last_name}
                </h3>
              </div>
              <button
                onClick={() => setHistoryDrawerItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(!historyDrawerItem.interaction_history || historyDrawerItem.interaction_history.length === 0) ? (
                <p className="text-slate-500 py-6 text-center">
                  No prior interaction logs recorded for this outreach task.
                </p>
              ) : (
                historyDrawerItem.interaction_history.map((log, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{log.timestamp}</span>
                      <span className="uppercase font-semibold text-slate-700">{log.channel}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{log.notes}</p>
                    {log.outcome && (
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Outcome: {log.outcome}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

