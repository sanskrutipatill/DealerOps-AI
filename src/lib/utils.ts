import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val);
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculates days in inventory from inventory date
 */
export function calculateDaysInInventory(inventoryDate: string): number {
  if (!inventoryDate) return 0;
  const invDate = new Date(inventoryDate);
  const today = new Date();
  const diffTime = today.getTime() - invDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Aging category badge helper
 */
export function getAgingSeverity(days: number): {
  label: string;
  badgeClass: string;
  isAging: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
} {
  if (days >= 90) {
    return {
      label: 'Critical (90+ d)',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isAging: true,
      priority: 'critical',
    };
  }
  if (days >= 60) {
    return {
      label: 'High (60-89 d)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      isAging: true,
      priority: 'high',
    };
  }
  if (days >= 30) {
    return {
      label: 'Moderate (30-59 d)',
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      isAging: true,
      priority: 'medium',
    };
  }
  return {
    label: 'Fresh (<30 d)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isAging: false,
    priority: 'low',
  };
}

