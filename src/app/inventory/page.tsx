'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Car,
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Trash2,
  Edit,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowUpDown,
  DollarSign,
} from 'lucide-react';
import { Vehicle, VehicleStatus, FuelType, TransmissionType, BodyType } from '@/types';
import { formatCurrency, formatDate, getAgingSeverity } from '@/lib/utils';

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'age_desc' | 'price_desc' | 'price_asc' | 'year_desc'>('age_desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    vin: '',
    stock_number: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    body_type: 'Sedan' as BodyType,
    purchase_price: 25000,
    selling_price: 29500,
    mileage: 5000,
    fuel_type: 'Gasoline' as FuelType,
    transmission: 'Automatic' as TransmissionType,
    exterior_color: 'Black',
    interior_color: 'Black',
    inventory_date: new Date().toISOString().split('T')[0],
    status: 'available' as VehicleStatus,
    location_bay: 'Lot A Row 1',
    notes: '',
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (fuelFilter !== 'all') params.append('fuel_type', fuelFilter);
      if (ageFilter === 'over30') params.append('minAge', '30');
      if (ageFilter === 'over60') params.append('minAge', '60');
      if (ageFilter === 'over90') params.append('minAge', '90');

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const data = await res.json();
      let list: Vehicle[] = data.vehicles || [];

      // Sorting
      if (sortBy === 'age_desc') {
        list.sort((a, b) => (b.days_in_inventory || 0) - (a.days_in_inventory || 0));
      } else if (sortBy === 'price_desc') {
        list.sort((a, b) => b.selling_price - a.selling_price);
      } else if (sortBy === 'price_asc') {
        list.sort((a, b) => a.selling_price - b.selling_price);
      } else if (sortBy === 'year_desc') {
        list.sort((a, b) => b.year - a.year);
      }

      setVehicles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, fuelFilter, ageFilter, sortBy]);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      vin: `1G1YY${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      stock_number: `STK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      brand: 'Toyota',
      model: 'RAV4 Hybrid',
      year: 2024,
      trim: 'XLE Premium',
      body_type: 'SUV',
      purchase_price: 31000,
      selling_price: 35800,
      mileage: 6200,
      fuel_type: 'Hybrid',
      transmission: 'Automatic',
      exterior_color: 'Magnetic Gray Metallic',
      interior_color: 'Black SofTex',
      inventory_date: new Date().toISOString().split('T')[0],
      status: 'available',
      location_bay: 'Front Lot Row 3',
      notes: 'Clean title single-owner vehicle.',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vin: vehicle.vin,
      stock_number: vehicle.stock_number,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim || '',
      body_type: vehicle.body_type,
      purchase_price: vehicle.purchase_price,
      selling_price: vehicle.selling_price,
      mileage: vehicle.mileage,
      fuel_type: vehicle.fuel_type,
      transmission: vehicle.transmission,
      exterior_color: vehicle.exterior_color,
      interior_color: vehicle.interior_color || '',
      inventory_date: vehicle.inventory_date,
      status: vehicle.status,
      location_bay: vehicle.location_bay || '',
      notes: vehicle.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        const res = await fetch(`/api/inventory/${editingVehicle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Update failed');
        setMessage({ text: 'Vehicle updated successfully.', type: 'success' });
      } else {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Creation failed');
        setMessage({ text: 'Vehicle added to inventory.', type: 'success' });
      }

      setIsModalOpen(false);
      fetchVehicles();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from inventory?`)) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setMessage({ text: 'Vehicle removed from inventory.', type: 'success' });
      fetchVehicles();
      if (detailVehicle?.id === id) setDetailVehicle(null);
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    }
  };

  // CSV Import handler
  const handleCsvImport = async () => {
    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        alert('Please provide CSV data with header row and at least one vehicle row.');
        return;
      }
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
        if (cols.length >= 6) {
          const [brand, model, yearStr, priceStr, mileageStr, fuel] = cols;
          await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vin: `VIN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
              stock_number: `STK-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
              brand: brand || 'Generic',
              model: model || 'Sedan',
              year: parseInt(yearStr, 10) || 2023,
              body_type: 'Sedan',
              purchase_price: Math.max(1000, (parseFloat(priceStr) || 25000) * 0.85),
              selling_price: parseFloat(priceStr) || 25000,
              mileage: parseInt(mileageStr, 10) || 12000,
              fuel_type: (fuel as FuelType) || 'Gasoline',
              transmission: 'Automatic',
              exterior_color: 'Silver',
              inventory_date: new Date().toISOString().split('T')[0],
              status: 'available',
            }),
          });
          count++;
        }
      }
      setIsImportOpen(false);
      setImportText('');
      setMessage({ text: `Successfully imported ${count} vehicles from CSV.`, type: 'success' });
      fetchVehicles();
    } catch (e) {
      alert('Error parsing CSV. Please verify format.');
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
                <Car className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inventory Management
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                {vehicles.length} Units on Lot
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete vehicle registry, lot aging analysis, carrying cost calculations, and CSV workflows.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <a
              href="/api/reports?type=inventory_aging&format=csv"
              download
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
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

        {/* Filters & Search Control Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search VIN, Stock #, Make, Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-slate-900 placeholder:text-slate-400 text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available (Lot)</option>
              <option value="in_service">In Service</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>

            {/* Fuel Type */}
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Powertrains</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric (EV)</option>
              <option value="Diesel">Diesel</option>
            </select>

            {/* Aging Bracket */}
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Lot Ages</option>
              <option value="over30">Aging &gt; 30 Days</option>
              <option value="over60">Aging &gt; 60 Days (High)</option>
              <option value="over90">Aging &gt; 90 Days (Critical)</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer focus:outline-none"
            >
              <option value="age_desc">Sort: Oldest Lot Age</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="year_desc">Sort: Newest Model Year</option>
            </select>
          </div>
        </div>

        {/* Professional Data Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Vehicle / Stock #</th>
                  <th className="py-3 px-4">Powertrain & Trim</th>
                  <th className="py-3 px-4">Mileage</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Margin Spread</th>
                  <th className="py-3 px-4">Days on Lot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No vehicles found matching current filters.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const days = v.days_in_inventory || 0;
                    const aging = getAgingSeverity(days);
                    const margin = v.selling_price - v.purchase_price;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {v.year} {v.brand} {v.model}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span>{v.stock_number}</span>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[120px]">{v.vin}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          <div>{v.trim || v.body_type}</div>
                          <div className="text-[11px] text-slate-500">{v.fuel_type} • {v.transmission}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-800">
                          {v.mileage.toLocaleString()} mi
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900 font-mono">
                          {formatCurrency(v.selling_price)}
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-700">
                          +{formatCurrency(margin)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${aging.badgeClass}`}
                          >
                            {days} days ({aging.label.split(' ')[0]})
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              v.status === 'available'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : v.status === 'in_service'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : v.status === 'reserved'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {v.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setDetailVehicle(v)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Inspect Vehicle Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(v)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Edit Vehicle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id, `${v.year} ${v.brand} ${v.model}`)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Inspection Detail Drawer */}
        {detailVehicle && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Vehicle Inspection Dossier
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {detailVehicle.year} {detailVehicle.brand} {detailVehicle.model}
                </h2>
              </div>
              <button
                onClick={() => setDetailVehicle(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Card */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Selling Price:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(detailVehicle.selling_price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Acquisition Cost:</span>
                <span className="font-mono text-slate-700">
                  {formatCurrency(detailVehicle.purchase_price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Gross Margin Potential:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatCurrency(detailVehicle.selling_price - detailVehicle.purchase_price)}
                </span>
              </div>
            </div>

            {/* Aging & Carrying Cost Calculation */}
            <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Inventory Aging & Holding Diagnostics</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span>Days in Stock:</span>
                <span className="font-mono font-bold">{detailVehicle.days_in_inventory} Days</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span>Intake Date:</span>
                <span className="font-mono">{formatDate(detailVehicle.inventory_date)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span>Floorplan Daily Holding Rate:</span>
                <span className="font-mono">$24.50 / day</span>
              </div>
              <div className="flex items-center justify-between text-xs text-rose-700 font-semibold pt-1 border-t border-amber-200">
                <span>Accumulated Carrying Cost:</span>
                <span className="font-mono">
                  {formatCurrency((detailVehicle.days_in_inventory || 0) * 24.5)}
                </span>
              </div>
            </div>

            {/* Vehicle Specifications Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vehicle Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded p-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">VIN</span>
                  <span className="font-mono font-semibold text-slate-800 break-all">{detailVehicle.vin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Stock Number</span>
                  <span className="font-mono font-semibold text-slate-800">{detailVehicle.stock_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mileage</span>
                  <span className="font-mono text-slate-800">{detailVehicle.mileage.toLocaleString()} mi</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Body Type</span>
                  <span className="text-slate-800">{detailVehicle.body_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Exterior Color</span>
                  <span className="text-slate-800">{detailVehicle.exterior_color}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Location Bay</span>
                  <span className="text-slate-800">{detailVehicle.location_bay || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {detailVehicle.notes && (
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                  Dealership Intake Notes
                </span>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
                  {detailVehicle.notes}
                </p>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  openEditModal(detailVehicle);
                  setDetailVehicle(null);
                }}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Edit Vehicle Details
              </button>
            </div>
          </div>
        )}

        {/* Add / Edit Vehicle Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingVehicle ? 'Edit Vehicle Record' : 'Add New Inventory Unit'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Brand / Make</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Model</label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Year</label>
                    <input
                      type="number"
                      required
                      min={1990}
                      max={2030}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2024 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">VIN (17 Characters)</label>
                    <input
                      type="text"
                      required
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Stock Number</label>
                    <input
                      type="text"
                      required
                      value={formData.stock_number}
                      onChange={(e) => setFormData({ ...formData, stock_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Purchase Price ($)</label>
                    <input
                      type="number"
                      required
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Selling Price ($)</label>
                    <input
                      type="number"
                      required
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mileage (Miles)</label>
                    <input
                      type="number"
                      required
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Powertrain</label>
                    <select
                      value={formData.fuel_type}
                      onChange={(e: any) => setFormData({ ...formData, fuel_type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                    >
                      <option value="Gasoline">Gasoline</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                    >
                      <option value="available">Available (Lot)</option>
                      <option value="in_service">In Service</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Inventory Intake Date</label>
                    <input
                      type="date"
                      required
                      value={formData.inventory_date}
                      onChange={(e) => setFormData({ ...formData, inventory_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location Bay / Lot Spot</label>
                  <input
                    type="text"
                    value={formData.location_bay}
                    onChange={(e) => setFormData({ ...formData, location_bay: e.target.value })}
                    placeholder="e.g. Front Lot Row 2, Showroom Floor"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                  >
                    {editingVehicle ? 'Update Vehicle' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {isImportOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Import Vehicles via CSV</h3>
                </div>
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-2">
                Paste CSV content formatted as: <br />
                <code className="text-[11px] font-mono bg-slate-100 p-1 rounded block mt-1">
                  Brand,Model,Year,SellingPrice,Mileage,FuelType
                </code>
              </p>

              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Brand,Model,Year,SellingPrice,Mileage,FuelType&#10;Subaru,Outback,2024,34500,8200,Gasoline&#10;Ford,Mustang Mach-E,2023,41000,14000,Electric"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs focus:bg-white focus:outline-none"
              />

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  Parse &amp; Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

