import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatsData {
  totalApplications: number;
  approved: number;
  flagged: number;
  denied: number;
  fraudDetectionRate: number;
}

interface StatsGridProps {
  stats?: StatsData | null;
}

interface StatCardConfig {
  label: string;
  key: keyof StatsData;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend: number;
  trendLabel: string;
  format?: (v: number) => string;
}

const defaultStats: StatsData = {
  totalApplications: 1284,
  approved: 847,
  flagged: 156,
  denied: 93,
  fraudDetectionRate: 94.2,
};

const cards: StatCardConfig[] = [
  {
    label: 'Total Applications',
    key: 'totalApplications',
    icon: FileText,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    trend: 12.5,
    trendLabel: 'vs last month',
  },
  {
    label: 'Approved',
    key: 'approved',
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/10',
    trend: 8.3,
    trendLabel: 'vs last month',
  },
  {
    label: 'Flagged for Review',
    key: 'flagged',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-400/10',
    trend: -3.1,
    trendLabel: 'vs last month',
  },
  {
    label: 'Denied',
    key: 'denied',
    icon: XCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10',
    trend: -5.7,
    trendLabel: 'vs last month',
  },
  {
    label: 'Fraud Detection Rate',
    key: 'fraudDetectionRate',
    icon: ShieldCheck,
    iconColor: 'text-accent-green',
    iconBg: 'bg-accent-green/10',
    trend: 2.1,
    trendLabel: 'vs last month',
    format: (v: number) => `${v}%`,
  },
];

export default function StatsGrid({ stats }: StatsGridProps) {
  const data = stats ?? defaultStats;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = data[card.key];
        const formatted = card.format ? card.format(value) : value.toLocaleString();
        const isPositive = card.trend >= 0;

        // For "Denied" and "Flagged", a negative trend is good
        const isGoodTrend =
          card.key === 'denied' || card.key === 'flagged' ? !isPositive : isPositive;

        return (
          <div
            key={card.key}
            className="rounded-xl border border-navy-700 bg-navy-800 p-5 transition-colors hover:border-navy-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">{card.label}</span>
              <div className={cn('rounded-lg p-2', card.iconBg)}>
                <Icon className={cn('h-4 w-4', card.iconColor)} />
              </div>
            </div>

            <div className="mt-3">
              <span className="font-heading text-2xl font-bold text-white">{formatted}</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp
                  className={cn('h-3.5 w-3.5', isGoodTrend ? 'text-green-400' : 'text-red-400')}
                />
              ) : (
                <TrendingDown
                  className={cn('h-3.5 w-3.5', isGoodTrend ? 'text-green-400' : 'text-red-400')}
                />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isGoodTrend ? 'text-green-400' : 'text-red-400'
                )}
              >
                {isPositive ? '+' : ''}
                {card.trend}%
              </span>
              <span className="text-xs text-gray-600">{card.trendLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
