export const PROGRAMS = [
  {
    type: 'SOLAR_REBATE',
    name: 'Solar Panel Rebate',
    maxAmount: 25000,
    description: 'Rebate for residential solar panel installation',
    icon: 'Sun',
  },
  {
    type: 'EV_CREDIT',
    name: 'EV Tax Credit',
    maxAmount: 7500,
    description: 'Tax credit for electric vehicle purchase',
    icon: 'Car',
  },
  {
    type: 'WEATHERIZATION',
    name: 'Home Weatherization Grant',
    maxAmount: 15000,
    description: 'Grant for home insulation and weatherization',
    icon: 'Home',
  },
  {
    type: 'CLEAN_ENERGY_BUSINESS',
    name: 'Clean Energy Small Business Grant',
    maxAmount: 50000,
    description: 'Grant for small businesses adopting clean energy',
    icon: 'Building2',
  },
  {
    type: 'HEAT_PUMP',
    name: 'Heat Pump Installation Rebate',
    maxAmount: 8000,
    description: 'Rebate for heat pump installation',
    icon: 'Thermometer',
  },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SCREENING: 'Screening',
  REVIEWED: 'Reviewed',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  ARCHIVED: 'Archived',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  SCREENING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REVIEWED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  DENIED: 'bg-red-500/10 text-red-400 border-red-500/20',
  ARCHIVED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};
