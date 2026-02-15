import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(date));
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-red-400';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-400';
  }
}

export function getRiskBgColor(risk: string): string {
  switch (risk) {
    case 'low': return 'bg-green-400/10 text-green-400 border-green-400/20';
    case 'medium': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    case 'high': return 'bg-red-400/10 text-red-400 border-red-400/20';
    case 'critical': return 'bg-red-600/10 text-red-600 border-red-600/20';
    default: return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
  }
}

export function getScoreColor(score: number): string {
  if (score <= 25) return '#22C55E';
  if (score <= 55) return '#EAB308';
  if (score <= 75) return '#EF4444';
  return '#DC2626';
}

export const PROGRAM_LABELS: Record<string, string> = {
  SOLAR_REBATE: 'Solar Panel Rebate',
  EV_CREDIT: 'EV Tax Credit',
  WEATHERIZATION: 'Home Weatherization Grant',
  CLEAN_ENERGY_BUSINESS: 'Clean Energy Small Business Grant',
  HEAT_PUMP: 'Heat Pump Installation Rebate',
};
