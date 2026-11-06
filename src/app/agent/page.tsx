'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { AgentMessage, AgentAction, AgentToolCallRecord } from '@/types';
import { formatCurrency } from '@/lib/utils';

const SUGGESTED_QUERIES = [
  'Show all vehicles that have been in inventory for more than 30 days.',
  'Which vehicles need servicing this week?',
  'Generate this month\'s operations report.',
  'Find customers whose service appointments are overdue.',
  'Identify inventory that needs attention.',
];

export default function AgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **DealerOps AI Operations Agent**.\n\nI am connected to the dealership database with controlled operational tools. You can query inventory aging, inspect service schedules, generate executive operations summaries, or request price markdowns.\n\n*How can I assist dealership operations today?*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        'Show 30+ Day Vehicles',
        'Which vehicles need servicing this week?',
        'Identify inventory that needs attention',
        'Generate operations report',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'approvals' | 'audit'>('chat');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load pending approvals
  const loadPendingActions = async () => {
    try {
      const res = await fetch('/api/agent/actions?status=pending_approval');
      const data = await res.json();
      setPendingActions(data.actions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPendingActions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: AgentMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCalls,
        pendingActions: data.pendingActions,
        quickActions: data.quickActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      loadPendingActions();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: `Unable to process query: ${err.message}. Please verify the dealership database connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manager action approval handler
  const handleDecision = async (actionId: string, decision: 'approve' | 'reject') => {
    setApprovingId(actionId);
    try {
      const res = await fetch('/api/agent/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, decision }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'decision-' + Date.now(),
            role: 'assistant',
            content: `**Action ${decision.toUpperCase()}ED:** ${data.message || 'Operation executed successfully against database records.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        loadPendingActions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-slate-900 text-white rounded">
                <Bot className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                AI Operations Agent
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                Gemini 2.0 Flash • Function Calling
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autonomous reasoning with strictly bounded database tools and human-in-the-loop approval verification.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conversational Console
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Manager Approvals</span>
              {pendingActions.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingActions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Chat Interface */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col h-[700px]">
              {/* Chat Stream Header */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium">Active Database Connection: PostgreSQL (RLS Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-mono text-slate-500">Read/Write Safe</span>
                </div>
              </div>

              {/* Message Transcript */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {msg.role === 'user' ? 'Operations Manager' : 'DealerOps Agent'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[90%] rounded-lg p-4 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Tool Call Record Pills (Proof of Real DB Execution) */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mb-3 space-y-1.5 pb-3 border-b border-slate-200">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center space-x-1">
                            <Terminal className="w-3 h-3 text-slate-600" />
                            <span>Structured Backend Tool Executed:</span>
                          </div>
                          {msg.toolCalls.map((tc, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 rounded p-2 text-[11px] font-mono space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  tool: {tc.toolName}()
                                </span>
                                <span className="text-emerald-700 bg-emerald-50 px-1 rounded text-[10px]">
                                  {tc.recordsCount ?? 0} record(s) inspected ({tc.executionTimeMs || 12}ms)
                                </span>
                              </div>
                              <div className="text-slate-500 truncate">
                                args: {JSON.stringify(tc.args)}
                              </div>
                              <div className="text-slate-700 font-sans text-[11px]">
                                &rarr; {tc.resultSummary}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content Rendered */}
                      <div className="prose prose-xs max-w-none text-slate-800 space-y-2 whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Quick Action Suggestion Chips */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5">
                          {msg.quickActions.map((qa, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(qa)}
                              className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded transition-colors font-medium flex items-center space-x-1"
                            >
                              <span>{qa}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex flex-col items-start">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1">DealerOps Agent</div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center space-x-2 text-slate-600">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
                      <span>Reasoning over database records and executing controlled tools...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask a question (e.g. 'Show all vehicles in inventory for more than 30 days')..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputQuery.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center space-x-1.5 transition-colors"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Guide & Prompts */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Sample Business Prompts
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Click any verified query below to test the agent's reasoning and database tool execution:
                </p>
                <div className="space-y-2">
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors flex items-start space-x-2 group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{q}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety & Protocol Specifications Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2.5 text-slate-600">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-800 text-xs">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  <span>Agent Safety & Architecture</span>
                </div>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-600">
                  <li>Zero unrestricted SQL injection risk.</li>
                  <li>Tools bound to schema-validated endpoints.</li>
                  <li>Multi-tenant dealership isolation enforced.</li>
                  <li>Consequential writes require manager sign-off.</li>
                  <li>Every tool execution logged to audit trail.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Manager Approval Queue Tab */
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Manager Action Approval Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consequential changes requested by the AI agent require manual human review before state changes execute.
                </p>
              </div>
              <button
                onClick={loadPendingActions}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            <div className="p-6 divide-y divide-slate-100">
              {pendingActions.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No Pending Approvals</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    All agent actions have been approved, executed, or dismissed.
                  </p>
                </div>
              ) : (
                pendingActions.map((action) => (
                  <div key={action.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {action.action_type.toUpperCase().replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {action.id.slice(0, 12)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Generated by AI Agent
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                          Operational Reasoning:
                        </span>
                        <p className="text-slate-600 leading-relaxed">{action.reasoning}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                          Calculated Financial & Operational Impact:
                        </span>
                        <p className="text-slate-600 leading-relaxed">{action.impact_summary}</p>
                      </div>
                    </div>

                    {/* Action Parameters Table */}
                    <div className="text-[11px] font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 overflow-x-auto">
                      <div className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Execution Payload:
                      </div>
                      <pre className="text-slate-800">{JSON.stringify(action.parameters, null, 2)}</pre>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-1">
                      <button
                        onClick={() => handleDecision(action.id, 'reject')}
                        disabled={approvingId === action.id}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Reject Action
                      </button>
                      <button
                        onClick={() => handleDecision(action.id, 'approve')}
                        disabled={approvingId === action.id}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        {approvingId === action.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>Approve & Execute</span>
                      </button>
                    </div>
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

