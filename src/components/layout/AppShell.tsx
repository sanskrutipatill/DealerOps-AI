'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Car,
  Wrench,
  Sparkles,
  Users,
  FileText,
  ShieldCheck,
  Bell,
  Menu,
  X,
  ChevronDown,
  Activity,
  Search,
  CheckCircle2,
  RefreshCw,
  Building2,
  UserCheck,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { Profile } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/', label: 'Operations Dashboard', icon: LayoutDashboard },
  { href: '/agent', label: 'AI Operations Agent', icon: Bot, highlight: true },
  { href: '/inventory', label: 'Inventory Management', icon: Car },
  { href: '/service', label: 'Service Appointments', icon: Wrench },
  { href: '/intelligence', label: 'Inventory Intelligence', icon: Sparkles },
  { href: '/followups', label: 'Customer Follow-ups', icon: Users },
  { href: '/reports', label: 'Report Generation', icon: FileText },
  { href: '/audit', label: 'Audit & Activity Log', icon: ShieldCheck },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load active profile from local mock state
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/inventory'); // verifies backend
      } catch (e) {
        console.error(e);
      }
    };
    loadProfile();

    // Set initial profile
    setActiveProfile({
      id: 'u2222222-2222-2222-2222-222222222222',
      dealership_id: 'd1111111-1111-1111-1111-111111111111',
      email: 'sarah.jenkins@apexautomotive.com',
      full_name: 'Sarah Jenkins',
      role: 'operations_manager',
      phone: '+1 (313) 555-0102',
    });

    setProfiles([
      {
        id: 'u2222222-2222-2222-2222-222222222222',
        dealership_id: 'd1111111-1111-1111-1111-111111111111',
        email: 'sarah.jenkins@apexautomotive.com',
        full_name: 'Sarah Jenkins',
        role: 'operations_manager',
      },
      {
        id: 'u1111111-1111-1111-1111-111111111111',
        dealership_id: 'd1111111-1111-1111-1111-111111111111',
        email: 'marcus.vance@apexautomotive.com',
        full_name: 'Marcus Vance',
        role: 'dealer_principal',
      },
      {
        id: 'u3333333-3333-3333-3333-333333333333',
        dealership_id: 'd1111111-1111-1111-1111-111111111111',
        email: 'carlos.mendez@apexautomotive.com',
        full_name: 'Carlos Mendez',
        role: 'service_advisor',
      },
      {
        id: 'u4444444-4444-4444-4444-444444444444',
        dealership_id: 'd1111111-1111-1111-1111-111111111111',
        email: 'elena.rostova@apexautomotive.com',
        full_name: 'Elena Rostova',
        role: 'sales_rep',
      },
    ]);
  }, []);

  const triggerScan = async () => {
    setIsScanning(true);
    setScanMessage('Running autonomous inventory diagnostic scan...');
    try {
      const res = await fetch('/api/agent/scan', { method: 'POST' });
      const data = await res.json();
      setScanMessage(
        `Diagnostic complete: Scanned ${data.data.inspectedVehicles} vehicles. Generated ${data.data.generatedAlerts.length} alerts.`
      );
      setTimeout(() => setScanMessage(null), 5000);
    } catch (e) {
      setScanMessage('Failed to execute scan.');
      setTimeout(() => setScanMessage(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  const roleLabelMap: Record<string, string> = {
    operations_manager: 'Operations Manager',
    dealer_principal: 'Dealer Principal (Owner)',
    service_advisor: 'Service Advisor',
    sales_rep: 'Sales Consultant',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-slate-300" />
          <span className="font-semibold text-sm tracking-wide">DealerOps AI</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-300 hover:text-white"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Dealership Branding Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h1 className="text-sm font-semibold tracking-wide text-white">DealerOps AI</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Apex Automotive Group</p>
            <p className="text-[10px] text-slate-500 font-mono">Store: APEX-METRO (Detroit)</p>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
            PROD
          </span>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations & AI
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-mono">
                    AGENT
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Autonomous Scan Trigger Box */}
        <div className="p-3 mx-3 mb-3 bg-slate-850 rounded border border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="font-medium flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Intelligence Engine</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">AUTO</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Automated monitoring for 60+ day aging, pricing risk, and service bottlenecks.
          </p>
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Analyzing...' : 'Run Intelligence Scan'}</span>
          </button>
        </div>

        {/* Role & User Profile Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 relative">
          <div
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {activeProfile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-white truncate">
                  {activeProfile?.full_name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {roleLabelMap[activeProfile?.role || ''] || activeProfile?.role}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          {/* Role Dropdown */}
          {roleDropdownOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-900 border border-slate-800 rounded shadow-xl p-1 z-50">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch Dealership Persona
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProfile(p);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    activeProfile?.id === p.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-slate-200">{p.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {roleLabelMap[p.role]}
                    </div>
                  </div>
                  {activeProfile?.id === p.id && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dealership Operations Console
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              RLS Isolation: Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Pill */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-medium">AI Operations Agent Online</span>
              <span className="text-slate-400 font-mono">• 8 Tools Active</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors relative"
                title="Open Notification Center"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>

              {/* Notification Popover Drawer */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <NotificationCenter onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                {activeProfile?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="font-medium text-slate-800">{activeProfile?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Global Scan Feedback Banner */}
        {scanMessage && (
          <div className="bg-slate-900 text-white text-xs px-6 py-2 flex items-center justify-between border-b border-slate-800 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{scanMessage}</span>
            </div>
            <button
              onClick={() => setScanMessage(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

