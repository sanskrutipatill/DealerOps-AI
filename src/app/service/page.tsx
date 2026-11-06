'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Wrench,
  Calendar,
  Clock,
  User,
  Car,
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { ServiceAppointment, ServiceTimeSlot, AppointmentStatus, Customer, Vehicle, Profile } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const SERVICE_TYPES = [
  'Oil & Filter Replacement',
  'Scheduled Factory Maintenance',
  'Brake System Service',
  'Engine Diagnostics (OBD-II)',
  'Tire Rotation & Balance',
  'Transmission Fluid Service',
  'Pre-Delivery Inspection (PDI)',
  'Multi-Point Safety Inspection',
];

const TIME_SLOTS: ServiceTimeSlot[] = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function ServicePage() {
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    service_type: SERVICE_TYPES[0],
    appointment_date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM' as ServiceTimeSlot,
    bay_number: 1,
    estimated_duration_hours: 1.5,
    estimated_cost: 160.0,
    service_notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptRes, custRes, vehRes] = await Promise.all([
        fetch(`/api/service${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
        fetch('/api/followups'), // customers can be derived or queried
        fetch('/api/inventory'),
      ]);

      const apptData = await apptRes.json();
      const vehData = await vehRes.json();

      setAppointments(apptData.appointments || []);
      setVehicles(vehData.vehicles || []);

      // Seed customers from mock
      setCustomers([
        { id: 'c1010000-0000-0000-0000-000000000001', dealership_id: 'd1', first_name: 'Robert', last_name: 'Sterling', email: 'r.sterling@summit.com', phone: '+1 313-555-4819', preferred_contact: 'phone' },
        { id: 'c1010000-0000-0000-0000-000000000002', dealership_id: 'd1', first_name: 'Jessica', last_name: 'Alvarez', email: 'jalvarez@medpartners.org', phone: '+1 313-555-8912', preferred_contact: 'email' },
        { id: 'c1010000-0000-0000-0000-000000000003', dealership_id: 'd1', first_name: 'David', last_name: 'Chen', email: 'david.chen@techaura.io', phone: '+1 248-555-3312', preferred_contact: 'sms' },
        { id: 'c1010000-0000-0000-0000-000000000006', dealership_id: 'd1', first_name: 'Michael', last_name: 'Patel', email: 'mpatel@biovista.com', phone: '+1 734-555-9140', preferred_contact: 'email' },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Real-time conflict validation
  const validateConflict = async (date: string, slot: ServiceTimeSlot, bay: number) => {
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_conflict',
          appointment_date: date,
          time_slot: slot,
          bay_number: bay,
        }),
      });
      const data = await res.json();
      if (data.hasConflict) {
        setConflictWarning(data.reason);
      } else {
        setConflictWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      customer_id: customers[0]?.id || '',
      vehicle_id: vehicles[0]?.id || '',
      service_type: SERVICE_TYPES[0],
      appointment_date: new Date().toISOString().split('T')[0],
      time_slot: '02:00 PM',
      bay_number: 3,
      estimated_duration_hours: 1.5,
      estimated_cost: 160.0,
      service_notes: '',
    });
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.conflict) {
          setConflictWarning(data.error);
          return;
        }
        throw new Error(data.error || 'Failed to book appointment');
      }

      setIsModalOpen(false);
      setMessage({ text: 'Service appointment scheduled successfully.', type: 'success' });
      fetchData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch('/api/service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Status change failed');
      setMessage({ text: `Appointment status updated to ${newStatus}.`, type: 'success' });
      fetchData();
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
                <Wrench className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Service Appointment Management
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                5 Active Bays
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Intelligent service scheduling with automated bay and advisor conflict prevention.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenModal}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
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

        {/* Filter Bar */}
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
              <option value="all">All Appointments</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Conflict Guard: Active (Zero overlap allowed)
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date &amp; Time Slot</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Bay</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading service records...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No service appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-900">{a.appointment_date}</div>
                        <div className="text-[11px] text-slate-500">{a.time_slot}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {a.customer ? `${a.customer.first_name} ${a.customer.last_name}` : 'Customer ID: ' + a.customer_id.slice(0, 8)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{a.customer?.phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {a.vehicle ? `${a.vehicle.year} ${a.vehicle.brand} ${a.vehicle.model}` : 'Vehicle On File'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{a.vehicle?.vin}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{a.service_type}</div>
                        {a.service_notes && (
                          <div className="text-[10px] text-slate-500 italic max-w-xs truncate">
                            {a.service_notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800">
                        {a.bay_number ? `Bay #${a.bay_number}` : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatCurrency(a.estimated_cost)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            a.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : a.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : a.status === 'overdue'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {a.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'in_progress')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium"
                            >
                              Start
                            </button>
                          )}
                          {a.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'completed')}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {a.status === 'overdue' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'scheduled')}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium"
                            >
                              Re-open
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Modal with Conflict Prevention Engine */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Book Service Appointment</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conflict Prevention Alert Banner */}
              {conflictWarning && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Schedule Conflict Detected:</span>
                    <p className="mt-0.5">{conflictWarning}</p>
                    <p className="text-[11px] text-rose-600 mt-1">Please select an alternate bay or time slot.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Customer</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Vehicle</label>
                  <select
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.brand} {v.model} ({v.stock_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Type</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Appointment Date</label>
                    <input
                      type="date"
                      required
                      value={formData.appointment_date}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, appointment_date: val });
                        validateConflict(val, formData.time_slot, formData.bay_number);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Time Slot</label>
                    <select
                      value={formData.time_slot}
                      onChange={(e: any) => {
                        const slot = e.target.value;
                        setFormData({ ...formData, time_slot: slot });
                        validateConflict(formData.appointment_date, slot, formData.bay_number);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Service Bay (1-12)</label>
                    <select
                      value={formData.bay_number}
                      onChange={(e) => {
                        const bay = parseInt(e.target.value, 10);
                        setFormData({ ...formData, bay_number: bay });
                        validateConflict(formData.appointment_date, formData.time_slot, bay);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((bay) => (
                        <option key={bay} value={bay}>Bay #{bay}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Notes &amp; Diagnostics</label>
                  <textarea
                    rows={2}
                    value={formData.service_notes}
                    onChange={(e) => setFormData({ ...formData, service_notes: e.target.value })}
                    placeholder="Customer complaints, diagnostic codes, special oil requirements..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(conflictWarning)}
                    className="px-4 py-1.5 bg-slate-900 disabled:opacity-50 text-white rounded font-semibold hover:bg-slate-800"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

